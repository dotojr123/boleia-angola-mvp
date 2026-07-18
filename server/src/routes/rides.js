const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

/**
 * POST /api/rides - Criar nova viagem
 * Validações:
 * - Campos obrigatórios: origin, destination, departure_time, price_per_seat, available_seats
 * - departure_time > NOW()
 * - price_per_seat > 0
 * - available_seats > 0 e <= 100
 * - Usuário deve ser driver ou admin
 */
router.post('/', auth, async (req, res) => {
  const startTime = Date.now();
  const {
    origin,
    destination,
    origin_exact_point,
    destination_exact_point,
    pickup_zone,
    dropoff_zone,
    departure_time,
    price_per_seat,
    total_seats,
    available_seats,
    vehicle_id,
    status,
    description,
    currency,
    estimated_arrival,
    duration: ride_duration,
    baggage_policy,
    luggage_size,
    frequency,
    booking_mode,
    instant_booking,
    waypoints
  } = req.body;

  // Mapear campos frontend para banco (compatibilidade)
  const originExactPoint = origin_exact_point || pickup_zone;
  const destinationExactPoint = destination_exact_point || dropoff_zone;

  // Aceitar ambos os nomes (compatibilidade frontend)
  const availSeats = available_seats || req.body.seats_available;
  const totalSeats = total_seats || req.body.seats_total;

  try {
    // Validação de campos obrigatórios
    const missingFields = [];
    if (!origin) missingFields.push('origin');
    if (!destination) missingFields.push('destination');
    if (!departure_time) missingFields.push('departure_time');
    if (price_per_seat === undefined || price_per_seat === null) missingFields.push('price_per_seat');
    if (availSeats === undefined || availSeats === null) missingFields.push('available_seats');

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`
      });
    }

    // Validar departure_time > NOW()
    const departureDate = new Date(departure_time);
    const now = new Date();
    if (isNaN(departureDate.getTime())) {
      return res.status(400).json({ error: 'departure_time inválido' });
    }
    if (departureDate <= now) {
      return res.status(400).json({
        error: 'departure_time deve ser uma data/hora futura'
      });
    }

    // Validar price_per_seat > 0
    const price = parseFloat(price_per_seat);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ error: 'price_per_seat deve ser maior que 0' });
    }

    // Validar available_seats > 0 e <= 15 (BlaBlaCar style: max 15 for vans/buses)
    const seats = parseInt(availSeats, 10);
    if (isNaN(seats) || seats <= 0 || seats > 15) {
      return res.status(400).json({ error: 'available_seats deve ser entre 1 e 15' });
    }

    // Verificar usuário é motorista (role = 'driver' ou 'admin')
    const userRole = req.user.role?.toLowerCase();
    if (userRole !== 'driver' && userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas motoristas ou admins podem criar viagens' });
    }

    const driver_id = req.user.id;

    // Verify vehicle exists and belongs to driver (if vehicle_id provided)
    if (vehicle_id) {
      const vehicleCheck = await db.query(
        'SELECT owner_id FROM vehicles WHERE id = $1',
        [vehicle_id]
      );

      if (vehicleCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Veículo não encontrado' });
      }

      if (vehicleCheck.rows[0].owner_id !== driver_id && userRole !== 'admin') {
        return res.status(403).json({ error: 'Sem permissão para usar este veículo' });
      }
    }

    const query = `
      INSERT INTO rides (
        driver_id,
        origin_city,
        origin_exact_point,
        destination_city,
        destination_exact_point,
        departure_time,
        price_per_seat,
        total_seats,
        available_seats,
        vehicle_id,
        status,
        description,
        currency,
        estimated_arrival,
        duration,
        baggage_policy,
        luggage_size,
        frequency,
        booking_mode,
        instant_booking,
        waypoints
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
      RETURNING *
    `;

    const { rows } = await db.query(query, [
          driver_id,
          origin,
          originExactPoint || null,
          destination,
          destinationExactPoint || null,
          departure_time,
          price,
          totalSeats || seats,
          seats,
          vehicle_id || null,
          status || 'scheduled',
          description || null,
          currency || 'Kz',
          estimated_arrival || null,
          ride_duration || null,
          baggage_policy || null,
          luggage_size || null,
          frequency || null,
          booking_mode || null,
          instant_booking || false,
          waypoints ? JSON.stringify(waypoints) : null
        ]);

        const execDuration = Date.now() - startTime;
        console.log(`[RIDES] Viagem criada: tempo: ${execDuration}ms`);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[RIDES] Erro ao criar viagem:', err);
    res.status(500).json({ error: 'Erro ao criar viagem', details: err.message });
  }
});

/**
 * PATCH /api/rides/:id - Atualizar viagem
 * - Validar propriedade (apenas driver_id ou admin pode editar)
 * - Campos atualizáveis: origin, destination, departure_time, price_per_seat, available_seats, status
 * - Validar transição de status
 */
router.patch('/:id', auth, async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  const {
    origin,
    destination,
    pickup_zone,
    dropoff_zone,
    departure_time,
    price_per_seat,
    total_seats,
    available_seats,
    vehicle_id,
    status,
    description,
    estimated_arrival,
    duration: ride_duration,
    baggage_policy,
    luggage_size,
    frequency,
    booking_mode,
    instant_booking,
    waypoints
  } = req.body;

  // Aceitar ambos os nomes
  const availSeats = available_seats || req.body.seats_available;
  const totalSeats = total_seats || req.body.seats_total;

  try {
    const driver_id = req.user.id;
    const userRole = req.user.role?.toLowerCase();

    // Verify ride exists and get current status
    const rideCheck = await db.query(
      'SELECT driver_id, status, available_seats FROM rides WHERE id = $1',
      [id]
    );

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }

    const currentRide = rideCheck.rows[0];

    // Verify ownership (driver or admin)
    if (currentRide.driver_id !== driver_id && userRole !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para editar esta viagem' });
    }

    // Validar transição de status se status for fornecido
    if (status) {
      const currentStatus = currentRide.status;
      const validTransitions = {
        'scheduled': ['active', 'cancelled', 'scheduled'],
        'active': ['completed', 'active'],
        'completed': [],
        'cancelled': []
      };

      if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
        return res.status(400).json({
          error: `Transição de status inválida: ${currentStatus} -> ${status}. Transições válidas: ${validTransitions[currentStatus].join(', ')}`
        });
      }
    }

    // Validar departure_time se fornecido
    if (departure_time) {
      const departureDate = new Date(departure_time);
      if (isNaN(departureDate.getTime())) {
        return res.status(400).json({ error: 'departure_time inválido' });
      }
      if (departureDate <= new Date()) {
        return res.status(400).json({ error: 'departure_time deve ser uma data/hora futura' });
      }
    }

    // Validar price_per_seat se fornecido
    if (price_per_seat !== undefined && price_per_seat !== null) {
      const price = parseFloat(price_per_seat);
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({ error: 'price_per_seat deve ser maior que 0' });
      }
    }

    // Validar available_seats se fornecido (max 15 for BlaBlaCar style)
    if (availSeats !== undefined && availSeats !== null) {
      const seats = parseInt(availSeats, 10);
      if (isNaN(seats) || seats <= 0 || seats > 15) {
        return res.status(400).json({ error: 'available_seats deve ser entre 1 e 15' });
      }
    }

    // Verify vehicle if provided
    if (vehicle_id) {
      const vehicleCheck = await db.query(
        'SELECT owner_id FROM vehicles WHERE id = $1',
        [vehicle_id]
      );

      if (vehicleCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Veículo não encontrado' });
      }

      if (vehicleCheck.rows[0].owner_id !== driver_id && userRole !== 'admin') {
        return res.status(403).json({ error: 'Sem permissão para usar este veículo' });
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (origin !== undefined) { updates.push(`origin_city = $${paramIndex++}`); values.push(origin); }
    if (destination !== undefined) { updates.push(`destination_city = $${paramIndex++}`); values.push(destination); }
    if (pickup_zone !== undefined) { updates.push(`pickup_zone = $${paramIndex++}`); values.push(pickup_zone); }
    if (dropoff_zone !== undefined) { updates.push(`dropoff_zone = $${paramIndex++}`); values.push(dropoff_zone); }
    if (departure_time !== undefined) { updates.push(`departure_time = $${paramIndex++}`); values.push(departure_time); }
    if (price_per_seat !== undefined) { updates.push(`price_per_seat = $${paramIndex++}`); values.push(parseFloat(price_per_seat)); }
    if (totalSeats !== undefined) { updates.push(`total_seats = $${paramIndex++}`); values.push(totalSeats); }
    if (availSeats !== undefined) { updates.push(`available_seats = $${paramIndex++}`); values.push(parseInt(availSeats, 10)); }
    if (vehicle_id !== undefined) { updates.push(`vehicle_id = $${paramIndex++}`); values.push(vehicle_id); }
    if (status !== undefined) { updates.push(`status = $${paramIndex++}`); values.push(status); }
    if (description !== undefined) { updates.push(`description = $${paramIndex++}`); values.push(description); }
    if (estimated_arrival !== undefined) { updates.push(`estimated_arrival = $${paramIndex++}`); values.push(estimated_arrival); }
    if (duration !== undefined) { updates.push(`duration = $${paramIndex++}`); values.push(duration); }
    if (baggage_policy !== undefined) { updates.push(`baggage_policy = $${paramIndex++}`); values.push(baggage_policy); }
    if (luggage_size !== undefined) { updates.push(`luggage_size = $${paramIndex++}`); values.push(luggage_size); }
    if (frequency !== undefined) { updates.push(`frequency = $${paramIndex++}`); values.push(frequency); }
    if (booking_mode !== undefined) { updates.push(`booking_mode = $${paramIndex++}`); values.push(booking_mode); }
    if (instant_booking !== undefined) { updates.push(`instant_booking = $${paramIndex++}`); values.push(instant_booking); }
    if (waypoints !== undefined) { updates.push(`waypoints = $${paramIndex++}`); values.push(waypoints ? JSON.stringify(waypoints) : null); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE rides SET
        ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const { rows } = await db.query(query, values);

    const duration = Date.now() - startTime;
    console.log(`[RIDES] Viagem atualizada: ${id}, tempo: ${duration}ms`);

    res.json(rows[0]);
  } catch (err) {
    console.error('[RIDES] Erro ao atualizar viagem:', err);
    res.status(500).json({ error: 'Erro ao atualizar viagem' });
  }
});

/**
 * DELETE /api/rides/:id - Cancelar viagem (soft delete)
 * - Validar se há bookings confirmados
 * - Se tiver passageiros, retornar erro 400
 * - Se OK, notificar passageiros e cancelar
 */
router.delete('/:id', auth, async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;

  try {
    const driver_id = req.user.id;
    const userRole = req.user.role?.toLowerCase();

    // Verify ride exists and get status
    const rideCheck = await db.query(
      'SELECT driver_id, status FROM rides WHERE id = $1',
      [id]
    );

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }

    // Verify ownership (driver or admin)
    if (rideCheck.rows[0].driver_id !== driver_id && userRole !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para remover esta viagem' });
    }

    // Check if ride has confirmed bookings
    const bookingsCheck = await db.query(
      `SELECT b.id as booking_id, b.passenger_id, b.status, p.full_name, p.phone
       FROM bookings b
       JOIN profiles p ON b.passenger_id = p.id
       WHERE b.ride_id = $1 AND b.status = 'confirmed'`,
      [id]
    );

    if (bookingsCheck.rows.length > 0) {
      const affectedPassengers = bookingsCheck.rows.map(row => ({
        booking_id: row.booking_id,
        passenger_id: row.passenger_id,
        full_name: row.full_name
      }));

      return res.status(400).json({
        error: 'Não é possível cancelar viagem com passageiros confirmados',
        affected_passengers: affectedPassengers,
        count: bookingsCheck.rows.length
      });
    }

    // Soft delete by setting status to cancelled
    const { rows } = await db.query(
      "UPDATE rides SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );

    const duration = Date.now() - startTime;
    console.log(`[RIDES] Viagem cancelada: ${id}, tempo: ${duration}ms`);

    res.json({ message: 'Viagem cancelada com sucesso', ride: rows[0] });
  } catch (err) {
    console.error('[RIDES] Erro ao cancelar viagem:', err);
    res.status(500).json({ error: 'Erro ao cancelar viagem' });
  }
});

/**
 * GET /api/rides/my-rides - Minhas viagens (para motoristas)
 * - Filtrar por driver_id = user.id
 * - Incluir bookings relacionados e vehicle details
 * - Ordenar por departure_time DESC
 * - Suportar filtro opcional: ?status=scheduled
 */
router.get('/my-rides', auth, async (req, res) => {
  const startTime = Date.now();
  const driver_id = req.user.id;
  const { status } = req.query;

  try {
    let query = `
      SELECT
        r.*,
        p.full_name as driver_name,
        p.avatar_url,
        v.make as vehicle_make,
        v.model as vehicle_model,
        v.color as vehicle_color,
        v.year as vehicle_year,
        (
          SELECT json_agg(json_build_object(
            'id', b.id,
            'passenger_id', b.passenger_id,
            'status', b.status,
            'passenger_name', bp.full_name,
            'passenger_phone', bp.phone
          ))
          FROM bookings b
          JOIN profiles bp ON b.passenger_id = bp.id
          WHERE b.ride_id = r.id
        ) as bookings
      FROM rides r
      JOIN profiles p ON r.driver_id = p.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.driver_id = $1
    `;

    const params = [driver_id];

    if (status) {
      query += ` AND r.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY r.departure_time DESC`;

    const { rows } = await db.query(query, params);

    const duration = Date.now() - startTime;
    console.log(`[RIDES] Minhas viagens listadas: ${rows.length} viagens, tempo: ${duration}ms`);

    res.json(rows);
  } catch (err) {
    console.error('[RIDES] Erro ao listar minhas viagens:', err);
    res.status(500).json({ error: 'Erro ao listar viagens' });
  }
});

/**
 * GET /api/rides/search - Buscar viagens
 * - Filtros: origin, destination, date, seats
 */
router.get('/search', async (req, res) => {
  const startTime = Date.now();
  const { origin, destination, date, seats } = req.query;

  try {
    let query = `
      SELECT r.*, p.full_name as driver_name, p.avatar_url, p.rating,
             v.make as vehicle_make, v.model as vehicle_model, v.color as vehicle_color
      FROM rides r
      JOIN profiles p ON r.driver_id = p.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.status = 'scheduled'
    `;
    const params = [];
         let paramIndex = 1;

         if (origin) {
           params.push(`%${origin}%`);
           query += ` AND r.origin_city ILIKE $${paramIndex++}`;
         }
         if (destination) {
           params.push(`%${destination}%`);
           query += ` AND r.destination_city ILIKE $${paramIndex++}`;
         }
         if (date) {
           params.push(date);
           query += ` AND DATE(r.departure_time) = $${paramIndex++}`;
         }
         if (seats) {
           params.push(parseInt(seats));
           query += ` AND r.available_seats >= $${paramIndex++}`;
         }

         query += ` AND r.departure_time > NOW() ORDER BY r.departure_time ASC`;

    const { rows } = await db.query(query, params);

    const duration = Date.now() - startTime;
    console.log(`[RIDES] Busca: ${rows.length} resultados, tempo: ${duration}ms`);

    res.json(rows);
  } catch (err) {
    console.error('[RIDES] Erro na busca:', err);
    res.status(500).json({ error: 'Erro na busca' });
  }
});

/**
 * GET /api/rides/:id/passengers - Passageiros da viagem
 * - Listar bookings com status='confirmed'
 * - Incluir dados do passageiro (profile: full_name, phone, rating)
 */
router.get('/:id/passengers', auth, async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;

  try {
    const driver_id = req.user.id;
    const userRole = req.user.role?.toLowerCase();

    // Verify ride exists and user is the driver or admin
    const rideCheck = await db.query(
      'SELECT driver_id FROM rides WHERE id = $1',
      [id]
    );

    if (rideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }

    if (rideCheck.rows[0].driver_id !== driver_id && userRole !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão para ver os passageiros desta viagem' });
    }

    const query = `
      SELECT
        b.id as booking_id,
        b.ride_id,
        b.passenger_id,
        b.status as booking_status,
        b.created_at,
        b.updated_at,
        p.full_name,
        p.phone,
        p.rating,
        p.avatar_url
      FROM bookings b
      JOIN profiles p ON b.passenger_id = p.id
      WHERE b.ride_id = $1 AND b.status = 'confirmed'
      ORDER BY b.created_at ASC
    `;

    const { rows } = await db.query(query, [id]);

    const duration = Date.now() - startTime;
    console.log(`[RIDES] Passageiros listados: ${rows.length} passageiros, tempo: ${duration}ms`);

    res.json(rows);
  } catch (err) {
    console.error('[RIDES] Erro ao listar passageiros:', err);
    res.status(500).json({ error: 'Erro ao listar passageiros' });
  }
});

/**
 * GET /api/rides - Listar todas as viagens disponíveis
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  const { origin, destination, status } = req.query;
  let query = `
    SELECT r.*, p.full_name, p.avatar_url, v.make as vehicle_make
    FROM rides r
    JOIN profiles p ON r.driver_id = p.id
    LEFT JOIN vehicles v ON r.vehicle_id = v.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (status) {
    params.push(status);
    query += ` AND r.status = $${paramIndex++}`;
  }
  if (origin) {
        params.push(`%${origin}%`);
        query += ` AND r.origin_city ILIKE $${paramIndex++}`;
      }
      if (destination) {
        params.push(`%${destination}%`);
        query += ` AND r.destination_city ILIKE $${paramIndex++}`;
      }
  query += " ORDER BY r.departure_time ASC";

  try {
    const { rows } = await db.query(query, params);

    const duration = Date.now() - startTime;
    console.log(`[RIDES] Todas as viagens listadas: ${rows.length} viagens, tempo: ${duration}ms`);

    res.json(rows);
  } catch (err) {
    console.error('[RIDES] Erro na busca:', err);
    res.status(500).json({ error: 'Erro na busca' });
  }
});

/**
 * GET /api/rides/:id - Detalhes da viagem
 */
router.get('/:id', async (req, res) => {
  const startTime = Date.now();
  try {
    const query = `
      SELECT
        r.*,
        p.full_name, p.avatar_url, p.verification_status,
        v.make as vehicle_make, v.model as vehicle_model, v.color as vehicle_color, v.year as vehicle_year
      FROM rides r
      JOIN profiles p ON r.driver_id = p.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.id = $1
    `;
    const { rows } = await db.query(query, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Viagem não encontrada' });
    }

    const duration = Date.now() - startTime;
    console.log(`[RIDES] Detalhes da viagem: ${req.params.id}, tempo: ${duration}ms`);

    res.json(rows[0]);
  } catch (err) {
    console.error('[RIDES] Erro ao buscar detalhes:', err);
    res.status(500).json({ error: 'Erro ao buscar detalhes' });
  }
});

module.exports = router;
