const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// POST /api/bookings - Create a booking (passenger books a ride)
router.post('/', auth, async (req, res) => {
  const { ride_id, seats_booked } = req.body;
  const passenger_id = req.user.id;

  if (!ride_id || !seats_booked || seats_booked <= 0) {
    return res.status(400).json({ error: 'ride_id e seats_booked são obrigatórios' });
  }

  try {
    // Check ride exists and has available seats
    const rideResult = await db.query(
      'SELECT driver_id, available_seats, price_per_seat, status FROM rides WHERE id = $1',
      [ride_id]
    );

    if (rideResult.rows.length === 0) {
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }

    const ride = rideResult.rows[0];

    if (ride.status !== 'scheduled' && ride.status !== 'active') {
      return res.status(400).json({ error: 'Esta viagem não está aceitando reservas' });
    }

    if (ride.available_seats < seats_booked) {
      return res.status(400).json({ error: 'Não há assentos disponíveis suficientes' });
    }

    // Check if passenger already booked this ride
    const existingBooking = await db.query(
      'SELECT id FROM bookings WHERE ride_id = $1 AND passenger_id = $2 AND status = $3',
      [ride_id, passenger_id, 'confirmed']
    );

    if (existingBooking.rows.length > 0) {
      return res.status(400).json({ error: 'Você já reservou esta viagem' });
    }

    const total_price = ride.price_per_seat * seats_booked;

    // Start transaction
    await db.query('BEGIN');

    // Create booking
    const bookingResult = await db.query(
      `INSERT INTO bookings (ride_id, passenger_id, seats_booked, total_price, status)
       VALUES ($1, $2, $3, $4, 'confirmed')
       RETURNING *`,
      [ride_id, passenger_id, seats_booked, total_price]
    );

    // Update available seats
    await db.query(
      'UPDATE rides SET available_seats = available_seats - $1 WHERE id = $2',
      [seats_booked, ride_id]
    );

    await db.query('COMMIT');

    res.status(201).json(bookingResult.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Erro ao criar reserva' });
  }
});

// GET /api/bookings - Get bookings for passenger (compatibility route)
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*, 
              r.origin_city AS origin, r.destination_city AS destination, r.departure_time, r.driver_id, r.price_per_seat,
              p.full_name as driver_name, p.phone as driver_phone, p.avatar_url as driver_avatar,
              v.make as vehicle_make, v.model as vehicle_model
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       JOIN profiles p ON r.driver_id = p.id
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       WHERE b.passenger_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
});

// GET /api/bookings/passenger - Get bookings for logged in passenger
router.get('/passenger', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*, 
              r.origin_city, r.destination_city, r.departure_time, r.driver_id, r.price_per_seat,
              p.full_name as driver_name, p.phone as driver_phone, p.avatar_url as driver_avatar,
              v.make as vehicle_make, v.model as vehicle_model
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       JOIN profiles p ON r.driver_id = p.id
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       WHERE b.passenger_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching passenger bookings:', error);
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
});

// GET /api/bookings/driver - Get bookings for driver's rides
router.get('/driver', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*, 
              r.origin_city, r.destination_city, r.departure_time,
              p.full_name as passenger_name, p.phone as passenger_phone, p.avatar_url as passenger_avatar
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       JOIN profiles p ON b.passenger_id = p.id
       WHERE r.driver_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching driver bookings:', error);
    res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
});

// PATCH /api/bookings/:id/status - Update booking status (driver confirms/rejects)
router.patch('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!['confirmed', 'rejected', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    // Verify driver owns the ride
    const bookingCheck = await db.query(
      `SELECT b.*, r.driver_id 
       FROM bookings b
       JOIN rides r ON b.ride_id = r.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    const booking = bookingCheck.rows[0];

    if (booking.driver_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para alterar esta reserva' });
    }

    // If rejecting/cancelling, restore available seats
    if ((status === 'rejected' || status === 'cancelled') && booking.status === 'confirmed') {
      await db.query(
        'UPDATE rides SET available_seats = available_seats + $1 WHERE id = $2',
        [booking.seats_booked, booking.ride_id]
      );
    }

    const { rows } = await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status da reserva' });
  }
});

module.exports = router;