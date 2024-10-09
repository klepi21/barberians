// pages/api/auth.ts
import { NextApiRequest, NextApiResponse } from 'next'

const ADMIN_PIN = process.env.ADMIN_PIN

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { pin } = req.body
    if (pin === ADMIN_PIN) {
      res.status(200).json({ authenticated: true })
    } else {
      res.status(401).json({ authenticated: false })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}