const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/driver/earnings - Calcula ganhos reais do motorista
router.get('/earnings', auth, async (req, res) => {
    try {
        const query = `
            SELECT 
                COALESCE(SUM(b.total_price), 0) as total_earned,
                COUNT(b.id) as total_bookings
            FROM bookings b
            JOIN rides r ON b.ride_id = r.id
            WHERE r.driver_id = $1 AND b.status = 'confirmed'
        `;
        const earningsRes = await db.query(query, [req.user.id]);
        
        const historyQuery = `
            SELECT 
                b.id, r.origin_city as origin, r.destination_city as destination, b.total_price as amount, 
                b.updated_at as date, b.status
            FROM bookings b
            JOIN rides r ON b.ride_id = r.id
            WHERE r.driver_id = $1 AND b.status IN ('confirmed', 'completed')
            ORDER BY b.updated_at DESC
            LIMIT 10
        `;
        const historyRes = await db.query(historyQuery, [req.user.id]);

        res.json({
            balance: earningsRes.rows[0].total_earned,
            stats: {
                total_bookings: earningsRes.rows[0].total_bookings,
                monthly_growth: "+10%" // Mock de tendência por enquanto
            },
            transactions: historyRes.rows.map(tx => ({
                id: tx.id,
                route: `${tx.origin} -> ${tx.destination}`,
                amount: parseFloat(tx.amount),
                date: tx.date.toISOString().split('T')[0],
                status: 'paid'
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao calcular ganhos' });
    }
});


// GET /api/driver/dashboard - Dashboard do motorista
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Only drivers can access
    if (req.user.role !== 'driver' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a motoristas' });
    }

    const driverId = req.user.id;

    // Stats
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM rides WHERE driver_id = $1) as total_rides,
        (SELECT COUNT(*) FROM bookings b JOIN rides r ON b.ride_id = r.id WHERE r.driver_id = $1 AND b.status = 'confirmed') as total_bookings,
        (SELECT COALESCE(SUM(b.total_price), 0) FROM bookings b JOIN rides r ON b.ride_id = r.id WHERE r.driver_id = $1 AND b.status = 'confirmed') as total_earned,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE reviewee_id = $1) as avg_rating
    `;

    // Upcoming rides
    const upcomingQuery = `
      SELECT id, origin_city as origin, destination_city as destination, departure_time, available_seats, total_seats, price_per_seat, status
      FROM rides 
      WHERE driver_id = $1 AND departure_time > NOW() AND status = 'active'
      ORDER BY departure_time ASC
      LIMIT 5
    `;

    // Recent bookings
    const recentBookingsQuery = `
      SELECT b.id, b.status, b.seats_booked, b.total_price, b.created_at,
             p.full_name as passenger_name
      FROM bookings b
      JOIN profiles p ON b.passenger_id = p.id
      JOIN rides r ON b.ride_id = r.id
      WHERE r.driver_id = $1
      ORDER BY b.created_at DESC
      LIMIT 5
    `;

    const [statsRes, upcomingRes, bookingsRes] = await Promise.all([
      db.query(statsQuery, [driverId]),
      db.query(upcomingQuery, [driverId]),
      db.query(recentBookingsQuery, [driverId])
    ]);

    res.json({
      stats: statsRes.rows[0],
      upcoming_rides: upcomingRes.rows,
      recent_bookings: bookingsRes.rows
    });
  } catch (err) {
    console.error('Error in driver dashboard:', err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

module.exports = router;
