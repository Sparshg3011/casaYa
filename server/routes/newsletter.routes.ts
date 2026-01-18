import { Router, Request, Response } from 'express';
import { 
  subscribeToNewsletter, 
  getSubscriber, 
  getAllSubscribers, 
  generateNewsletterPDF 
} from '../services/newsletter.service';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({ status: 'OK', message: 'Newsletter service is running' });
});

router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and email are required' 
      });
    }

    const result = await subscribeToNewsletter(name, email);
    
    if (result.success) {
      return res.status(201).json(result);
    } else {
      if (result.message.includes('already subscribed')) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    }
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to subscribe to newsletter' 
    });
  }
});

router.get('/download/:subscriberId', async (req: Request, res: Response) => {
  try {
    const { subscriberId } = req.params;

    if (!subscriberId) {
      return res.status(400).json({ error: 'Subscriber ID is required' });
    }

    const subscriber = await getSubscriber(subscriberId);
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    const pdfBuffer = await generateNewsletterPDF();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="RentCasaYa.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF download error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to download PDF' 
    });
  }
});

router.get('/subscribers', async (_req: Request, res: Response) => {
  try {
    const subscribers = await getAllSubscribers();
    return res.status(200).json({ 
      success: true, 
      count: subscribers.length,
      subscribers 
    });
  } catch (error: any) {
    console.error('Get subscribers error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get subscribers' 
    });
  }
});

router.get('/subscriber/:subscriberId', async (req: Request, res: Response) => {
  try {
    const { subscriberId } = req.params;

    if (!subscriberId) {
      return res.status(400).json({ error: 'Subscriber ID is required' });
    }

    const subscriber = await getSubscriber(subscriberId);
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    return res.status(200).json({ 
      success: true, 
      subscriber: {
        name: subscriber.name,
        email: subscriber.email,
        subscribedAt: subscriber.subscribed_at
      }
    });
  } catch (error: any) {
    console.error('Get subscriber error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to get subscriber' 
    });
  }
});

export default router; 