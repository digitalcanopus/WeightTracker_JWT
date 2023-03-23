const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

const saltRounds = 10;

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'text/javascript');
      }
    }
}));

const upload = multer({ storage: storage });

mongoose.connect('mongodb://127.0.0.1:27017/weight-tracker', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch((err) => {
        console.log(err);
    });

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});
const Users = mongoose.model('Users', userSchema);

const weightSchema = new mongoose.Schema({
    date: Date,
    weight: Number,
    file: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' }
});
const Weight = mongoose.model('Weight', weightSchema);

function middleware(req, res, next) {
  //console.log('middleware');
  if (req.method === 'OPTIONS') {
    next();
  }
  try {
    const cookies = req.cookies;
    if (cookies && cookies.token) {
      const decodedData = jwt.verify(cookies.token, JWT_SECRET);
      console.log(decodedData);
      next();
    } else {
      return res.status(401).send({ message: 'authorize first' });
    }
  } catch (e) {
    console.log(e);
    return res.status(401).send({ message: 'authorize first' });
  }
}

app.get('/api/weights', middleware, (req, res) => {
  //console.log('get weights');
  const userId = req.cookies.user.id;
  Weight.find({ user: userId })
    .then(weights => {
      res.status(200).json(weights);
    })
    .catch(err => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.get('/api/weights/:id', (req, res) => {
  Weight.findById(req.params.id)
  .then(weight => {
    if (!weight) {
      res.status(404).send('Weight not found');
    } else {
      res.status(200).json(weight);
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).send(err);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post('/api/weights', upload.single('file'), (req, res) => {
  const userId = req.cookies.user.id;
  const weight = new Weight({
    date: req.body.date,
    weight: req.body.weight,
    file: req.file ? req.file.originalname : '',
    user: userId
  });

  weight.save()
  .then((newWeight) => {
    res.status(200).json(newWeight);
  })
  .catch((err) => {
    console.log(err);
    res.status(500).send(err);
  });
});

app.put('/api/weights/:id', upload.single('file'), (req, res) => {
  const userId = req.cookies.user.id;
  const updatedWeight = {
    date: req.body.date,
    weight: req.body.weight,
    //file: req.file ? req.file.originalname : "",
    user: userId
  };

  if (req.file) {
    updatedWeight.file = req.file.originalname;
  } else {
    Weight.findById(req.params.id)
      .then(weight => {
        if (weight) {
          updatedWeight.file = weight.file;
        }
      })
      .catch(err => {
        console.log(err);
      });
  }
  
  Weight.findByIdAndUpdate(req.params.id, updatedWeight, { new: true })
    .then(weight => {
      if (!weight) {
        res.status(404).send('Weight not found');
      } else {
        res.status(200).json(weight);
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.put('/api/weights/fdel/:id', (req, res) => {
  const userId = req.cookies.user.id;
  const updatedWeight = {
    date: req.body.date,
    weight: req.body.weight,
    file: "",
    user: userId
  };
  
  Weight.findByIdAndUpdate(req.params.id, updatedWeight, { new: true })
    .then(weight => {
      if (!weight) {
        res.status(404).send('Weight not found');
      } else {
        res.status(200).json(weight);
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.delete('/api/weights/:id', (req, res) => {
    Weight.findByIdAndDelete(req.params.id)
    .then(weight => {
        if (!weight) {
            res.status(404).send('Weight not found');
        } else {
        res.status(200).send('Weight deleted successfully');
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).send(err);
    });
});

const JWT_SECRET = 'hello123';

app.post('/api/users/register', async (req, res) => {
  //console.log(req.body);
  const { username, password } = req.body;
  try {
    const existingUser = await Users.findOne({ username: username });
    if (existingUser) {
      return res.status(400).send('Username already exists');
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);  

    const newUser = new Users({
      username,
      password: hashedPassword,
    });
    newUser.save();
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.cookie('token', token, { httpOnly: true, sameSite: 'strict', expires: new Date(Date.now() + 1 * 3600000) });
    res.cookie('user', { username: req.body.username, id: newUser._id }, {
      httpOnly: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 1 * 3600000)
    });
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.status(500).send('Error registering new user');
  }
});

app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }
  try {
    const user = await Users.findOne({ username });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { 
      httpOnly: true, sameSite: 'strict', expires: new Date(Date.now() + 1 * 3600000) });
    res.cookie('user', { 
      username: user.username, id: user._id }, { httpOnly: true, sameSite: 'strict', expires: new Date(Date.now() + 1 * 3600000) });  

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/exit', async(req, res) => {
  res.status(200);
  res.cookie('token', '', { maxAge: -1 });
  res.cookie('user', '', { maxAge: -1 });
  res.send();
});

app.use(express.static(path.join(__dirname, 'public'), { 'Content-Type': 'text/javascript' }));
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});