import 'server-only'
import nodemailer from 'nodemailer'
import { formatDisplayDate, formatDisplayTime } from '@/lib/format'

// Configure via .env.local:
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// Example for Gmail: host=smtp.gmail.com, port=587, use an App Password

function getTransporter() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendBookingConfirmation(data: {
  to: string
  customerName: string
  businessName: string
  date: string
  timeSlot: string
}): Promise<void> {
  const transporter = getTransporter()
  if (!transporter) return

  const displayDate = formatDisplayDate(data.date)
  const displayTime = formatDisplayTime(data.timeSlot)

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: data.to,
    subject: `Booking Confirmed – ${data.businessName}`,
    text: `Hi ${data.customerName},\n\nYour booking at ${data.businessName} is confirmed.\n\nDate: ${displayDate}\nTime: ${displayTime}\n\nSee you then!`,
    html: `
      <p>Hi <strong>${data.customerName}</strong>,</p>
      <p>Your booking at <strong>${data.businessName}</strong> is confirmed.</p>
      <table>
        <tr><td><strong>Date:</strong></td><td>${displayDate}</td></tr>
        <tr><td><strong>Time:</strong></td><td>${displayTime}</td></tr>
      </table>
      <p>See you then!</p>
    `,
  })
}
