const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const schema = require('./js/cms-schema');
const {containerId}=require('./js/gtm-config');

function validateValues(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected a content object.');
  const values = {};
  for (const field of schema.fields) {
    const value = input[field.key] ?? field.default;
    if (typeof value !== 'string' || value.length > (field.type === 'textarea' ? 16000 : 2000)) throw new Error(`Invalid or too long: ${field.label}`);
    if (field.type === 'color' && !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`Use a six-digit hex color for ${field.label}.`);
    if (field.type === 'email' && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)) throw new Error('Enter a valid contact email.');
    if (field.type === 'url' && !/^https?:\/\/[^\s<>"']+$/i.test(value)) throw new Error(`Enter a full web URL for ${field.label}.`);
    if (field.type === 'image' && value && !/^(?:\/?assets\/[a-z0-9_./-]+|https:\/\/[^\s<>"']+)$/i.test(value)) throw new Error(`Use an uploaded image, an assets path, or an HTTPS URL for ${field.label}.`);
    if (field.type === 'image' && value.split('/').includes('..')) throw new Error('Image paths cannot traverse directories.');
    if (field.type === 'number' && (!value.trim() || !Number.isFinite(Number(value)) || Number(value)<field.min || Number(value)>field.max)) throw new Error(`${field.label} must be between ${field.min} and ${field.max}.`);
    if (field.type === 'toggle' && !['true','false'].includes(value)) throw new Error(`Invalid setting: ${field.label}.`);
    values[field.key] = field.key==='tracking.gtmCode'?containerId(value):value;
  }
  if(Number(values['flight.firstMin'])>Number(values['flight.firstMax']) || Number(values['flight.secondMin'])>Number(values['flight.secondMax'])) throw new Error('Minimum multipliers must not exceed their maximum.');
  return values;
}

function decodeImage(dataURL) {
  const match = /^data:(image\/(?:png|jpeg|webp|svg\+xml));base64,([a-z0-9+/=\r\n]+)$/i.exec(dataURL || '');
  if (!match) throw new Error('Choose a PNG, JPEG, WebP or SVG image.');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 6 * 1024 * 1024) throw new Error('Images must be smaller than 6 MB.');
  const mime = match[1].toLowerCase();
  const svg = bytes.toString('utf8');
  const valid = mime === 'image/png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : mime === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : mime === 'image/webp' ? bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP'
    : /<svg[\s>]/i.test(svg) && !/<\s*(script|foreignObject|iframe|style|animate\w*|set|a|image|use)\b|\bon\w+\s*=|(?:href|src)\s*=|<!DOCTYPE|<!ENTITY|javascript:|url\s*\(/i.test(svg);
  if (!valid) throw new Error('Invalid image or unsupported active SVG content. Export a plain SVG or PNG.');
  return { bytes, extension: { 'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/svg+xml':'svg' }[mime] };
}

function createCMS({ directory = path.join(__dirname, 'data'), uploadDirectory = path.join(__dirname, 'assets', 'uploads'), ephemeral = false, isAuthenticated = () => false } = {}) {
  const router = express.Router();
  const file = path.join(directory, 'site-content.json');
  const read = () => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { revision:0, updatedAt:null, values:{ ...schema.defaults } };
  const authorized = isAuthenticated;
  router.get('/content', (req,res,next) => { try { res.set('Cache-Control','no-store').json(read()); } catch(e) { next(e); } });
  router.get('/bootstrap.js', (req,res,next) => { try { res.set('Cache-Control','no-store').type('js').send('window.CMSContent='+JSON.stringify(read().values).replace(/</g,'\\u003c')+';'); } catch(e) { next(e); } });
  router.get('/access', (req,res) => res.set('Cache-Control','no-store').json({ canEdit:authorized(req), passwordRequired:true, localOnly:false, persistent:!ephemeral }));
  router.use((req,res,next) => {
    if (!authorized(req)) return res.status(401).json({ error:'Log in with your admin username and password.' });
    const originHost = (req.headers.origin || '').replace(/^https?:\/\//, '');
    if (req.headers.origin && originHost !== req.headers.host) return res.status(403).json({ error:'Cross-origin editing is not allowed.' });
    if (ephemeral) return res.status(503).json({ error:'This host has temporary storage. Run the CMS on a persistent Node server, or configure persistent storage before editing.' });
    next();
  });
  router.put('/content', express.json({limit:'1mb'}), (req,res) => {
    try {
      const current = read();
      if (req.body.revision !== current.revision) return res.status(409).json({ error:'Content changed in another editor. Reload the saved version before saving again.' });
      const next = { revision:current.revision+1, updatedAt:new Date().toISOString(), values:validateValues(req.body.values) };
      fs.mkdirSync(directory,{recursive:true});
      const temporary = file+'.'+crypto.randomUUID()+'.tmp';
      fs.writeFileSync(temporary, JSON.stringify(next,null,2));
      fs.renameSync(temporary,file);
      res.json(next);
    } catch(e) { res.status(400).json({ error:e.message }); }
  });
  router.post('/media', express.json({limit:'9mb'}), (req,res) => {
    try {
      const {bytes,extension} = decodeImage(req.body.dataURL);
      fs.mkdirSync(uploadDirectory,{recursive:true});
      const filename = crypto.randomUUID()+'.'+extension;
      fs.writeFileSync(path.join(uploadDirectory,filename),bytes);
      res.status(201).json({ url:'assets/uploads/'+filename });
    } catch(e) { res.status(400).json({ error:e.message }); }
  });
  router.use((err,req,res,next) => res.status(err.status || 500).json({ error:err.type === 'entity.too.large' ? 'File or content is too large.' : 'CMS request failed. Check the server logs.' }));
  return router;
}
module.exports = { createCMS, validateValues, decodeImage };
