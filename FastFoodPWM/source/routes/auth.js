const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

router.post('/register', [
  body('nome').notEmpty().withMessage('Nome obbligatorio'),
  body('cognome').notEmpty().withMessage('Cognome obbligatorio'),
  body('email').isEmail().withMessage('Email non valida'),
  body('pwd').isLength({ min: 6 }).withMessage('Password minima 6 caratteri'),
  body('cpwd').custom((value, { req }) => {
    if (value !== req.body.pwd) throw new Error('Le password non coincidono');
    return true;
  }),
  body('accountType')
    .custom(value => {
      if (!value) throw new Error('Tipo di account obbligatorio');

      const validTypes = ['cliente', 'ristoratore'];

      if (Array.isArray(value)) {
        if (value.length === 0) throw new Error('Devi selezionare almeno un tipo di account');
        for (const v of value) {
          if (!validTypes.includes(v)) throw new Error('Tipo di account non valido'); 
            }
        } else {
            if (!validTypes.includes(value)) throw new Error('Tipo di account non valido');
        }
        return true;
    })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, cognome, email, pwd } = req.body; 
    let { accountType } = req.body;

    if (!Array.isArray(accountType)) {
      accountType = [accountType];
    }

    // controlla se email esiste
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email già registrata' });

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(pwd, salt);

    const user = new User({
      nome, cognome, email: email.toLowerCase(), password: hashed, accountType
    });

    await user.save();

    // non restituiamo la password
    return res.status(201).json({ message: 'Utente creato', userId: user._id });
  } catch (err) {
    next(err);
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Email non valida'),
  body('pwd').notEmpty().withMessage('Password obbligatoria')
], async (req, res, next) => {
  try {
    // Validazione input
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { email, pwd } = req.body;

    // Cerca utente nel DB
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Credenziali non valide' });

    // Verifica password
    const isMatch = await bcrypt.compare(pwd, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Credenziali non valide' });

    // Login OK: puoi restituire dati o token (se usi JWT)
    return res.status(200).json({ message: 'Login riuscito', userId: user._id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
