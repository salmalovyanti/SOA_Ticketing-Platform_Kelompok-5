const service = require('./ticket.service');
const { purchaseTicketSchema } = require('./ticket.validations');

// Handler untuk
exports.createTicket = async (req, res) => {
  try {
    const ticket = await service.create(req.body);
    res.status(201).json(ticket);
  } catch (err) {
    console.error('❌ Error saat createTicket:', err);
    res.status(400).json({ error: err.message });
  }
};

// Handler untuk menampilkan seluruh data tiket
exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await service.getAll();
    res.json(tickets);
  } catch (err) {
    console.error('❌ Error saat getAllTickets:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Handler untuk menapilkan satu data tiket
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await service.getById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    console.error('❌ Error saat getTicketById:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Handler untuk mengedit data tiket
exports.updateTicket = async (req, res) => {
  try {
    const ticket = await service.update(req.params.id, req.body);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    console.error('❌ Error saat updateTicket:', err);
    res.status(400).json({ error: err.message });
  }
};

// Handler untuk menghapus data tiket
exports.deleteTicket = async (req, res) => {
  try {
    const deleted = await service.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Ticket not found' });
    res.status(204).send();
  } catch (err) {
    console.error('❌ Error saat deleteTicket:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Handler untuk melihat tiket berdasarkan satu event
exports.getByEventId = async (req, res) => {
  try {
    const tickets = await service.getByEventId(req.params.eventId);
    if (!tickets || tickets.length === 0) {
      return res.status(404).json({ error: 'Tickets not found for this event' });
    }
    res.status(200).json(tickets);
  } catch (err) {
    console.error('❌ Error saat getByEventId:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Handler untuk membeli tiket
exports.purchaseTicket = async (req, res) => {
  try {
    // Validate request data
    const { error, value } = purchaseTicketSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Call service to process ticket purchase
    const ticketPurchase = await service.purchase(value);

    if (!ticketPurchase) {
      return res.status(400).json({ error: 'Ticket purchase failed' });
    }

    res.status(201).json(ticketPurchase);
  } catch (err) {
    console.error('❌ Error saat purchaseTicket:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Handler untuk mengupload tiket dalam jumlah yang banyak
exports.bulkUploadTickets = async (req, res) => {
  try {
    const { event_id, tickets } = req.body;
    const uploadedTickets = await ticketService.bulkUploadTickets(event_id, tickets);
    return res.status(201).json({
      message: 'Tiket berhasil diunggah',
      uploaded_tickets: uploadedTickets
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || 'Terjadi kesalahan saat mengunggah tiket'
    });
  }
};