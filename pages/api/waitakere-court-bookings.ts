import { kv } from "@vercel/kv";
import { NextApiRequest, NextApiResponse } from "next";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch(req.method) {
    case 'POST': {
      const { data } = req.body;
      try {
        await kv.hset(`user_${data.username}`, {data});
        res.status(200).json({ message: `Your session will be booked for ${data.date} when the booking opens` });
      } catch(err) {
        console.log(err);
        res.status(400).json({ message: 'Failed' }); 
      }
      break;
    }
    case 'GET': {
      const { username } = req.query;
      return kv.hget(`user_${username}`, 'data');
    }
    default: res.status(405).json({ message: 'Method Not Allowed' })
  }
}
