import { Router, Request, Response } from 'express';
import { sendWelcomeEmail, verifyEmailService } from '../services/email.service';

const router = Router();

// Test email configuration
router.get('/verify', async (_req: Request, res: Response) => {
  try {
    const result = await verifyEmailService();
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test sending an email
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required'
      });
    }

    const result = await sendWelcomeEmail(email, name);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
