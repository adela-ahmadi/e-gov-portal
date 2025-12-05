// controllers/paymentController.js
export const confirmPayment = async (req, res) => {
  const { requestId } = req.params

  try {
    const requestResult = await pool.query(
      'SELECT id, status FROM requests WHERE id = $1',
      [requestId]
    )

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' })
    }

    const request = requestResult.rows[0]
    if (request.status !== 'Approved') {
      return res
        .status(400)
        .json({ message: 'Only approved requests can be paid' })
    }

    // Payment Update
    await pool.query(
      "UPDATE payments SET status = 'Paid', paid_at = NOW() WHERE request_id = $1",
      [requestId]
    )

    // Update Request Status
    await pool.query("UPDATE requests SET status = 'Paid' WHERE id = $1", [
      requestId
    ])

    res.json({ message: 'Payment confirmed successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}
