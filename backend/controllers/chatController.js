import Message from '../models/Message.js';

export const postMessage = async (req, res, io) => {
  try{
    const { eventId, text } = req.body;
    const msg = await Message.create({ event: eventId, user: req.user._id, text });
    const populated = await msg.populate('user','name');
    io.to(String(eventId)).emit('message', populated);
    res.json(populated);
  }catch(err){ res.status(500).json({ error: err.message }); }
};

export const getMessages = async (req, res) => {
  try{
    const messages = await Message.find({ event: req.params.eventId }).populate('user','name').sort({ createdAt: 1 });
    res.json(messages);
  }catch(err){ res.status(500).json({ error: err.message }); }
};
