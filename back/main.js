const express = require('express');
const net = require('net');
const path = require('path');
const projector = require('ecef-projector');

const app = express();
app.use(express.json())
const router = express.Router();

const client = new net.Socket();

client.connect(8084, '127.0.0.1', function() {
    console.log('Connected to SDR server.')
});

router.get('/ping', (req, res) => {
    res.send({ pong: true });
});

router.post('/sdr', (req, res) => {
    const body = req.body;
    let ecef;
    if(req.body.x) {
        ecef = {
            x: req.body.x,
            y: req.body.y,
            z: req.body.z
        }
    } else {
        ecef = projector.project(body.latitude, body.longitude, 0);
    }
    client.write(`ECEF ${ecef.join(' ')}\n`);
    res.send({
        sent: `ECEF ${ecef.join(' ')}\n`
    });
});

app.use('/api', router);
app.use(express.static(path.resolve(__dirname, '../dist')));

app.listen(8081);
