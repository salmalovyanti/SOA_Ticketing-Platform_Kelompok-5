const { Cart, Ticket, Event, Order, sequelize } = require('../models');

// Mengambil data isi keranjang user
exports.getCartByUser = async (user_id) => {
  return await Cart.findAll({
    where: { user_id },
    include: [
      {
        model: Ticket,
        as: 'ticket',
        attributes: ['ticket_id', 'name', 'price', 'stock'],
        include: [
          {
            model: Event,
            as: 'event',
            attributes: ['event_id', 'event_name', 'event_date']
          }
        ]
      }
    ],
    order: [['created_at', 'DESC']]
  });
};

// Menambahkan tiket ke dalam keranjang user
exports.addToCart = async (data) => {
  return await Cart.create({
    user_id: data.user_id,
    ticket_id: data.ticket_id,
    quantity: data.quantity
  });
};

// Memproses checkout dari keranjang user dan membuat pesanan baru
exports.checkout = async (userId, { payment_method }) => {
    const t = await sequelize.transaction(); // Mulai transaksi untuk menjaga konsistensi data

    try {
        // Ambil semua item dalam keranjang pengguna
        const cartItems = await Cart.findAll({
            where: {
                user_id: userId,
                deleted_at: null // hanya ambil item yang belum dihapus
            },
            include: {
                model: Ticket,
                as: 'ticket',
                where: { event_id },
                attributes: ['ticket_id', 'price', 'event_id']
            },
            transaction: t
        });

        if (!cartItems.length) {
            throw new Error('Tidak ada tiket dari event ini di keranjang');
        }
        // Hitung total harga
        const totalAmount = cartItems.reduce((total, item) => total + (item.quantity * item.ticket.price), 0); //
        // Buat entri di tabel orders
        const newOrder = await Order.create({
            user_id: userId,
            order_date: new Date(),
            status: 'pending',
            total_amount: totalAmount,
            payment_status: 'unpaid',
            payment_method: payment_method //
        }, { transaction: t });

        // Tambahkan item pesanan ke order_items
        const orderItems = cartItems.map(item => ({
            order_id: newOrder.order_id,
            ticket_id: item.ticket.ticket_id,
            quantity: item.quantity,
            price: item.ticket.price
        }));

        await OrderItem.bulkCreate(orderItems, { transaction: t });
        // Hapus item dari keranjang setelah checkout
        await Cart.destroy({
            where: {
                user_id: userId,
                ticket_id: cartItems.map(item => item.ticket_id)
            },
            transaction: t
        });

        // Commit transaksi jika semua berjalan lancar
        await t.commit();
        return newOrder;
    } catch (error) {
        // Rollback jika terjadi error
        await t.rollback();
        throw error;
    }
};