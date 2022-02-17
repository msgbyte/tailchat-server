import express from 'express';
import path from 'path';
import axios from 'axios';
const app = express();
const port = 8080;

const API = 'http://localhost:11000';
const clientUrl = `http://localhost:${port}`;
const request = axios.create({
  baseURL: API,
  transformRequest: [
    function (data) {
      let ret = '';
      for (let it in data) {
        ret +=
          encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&';
      }
      ret = ret.substring(0, ret.lastIndexOf('&'));
      return ret;
    },
  ],
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
  },
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, './app.html'));
});

app.get('/cb', async (req, res, next) => {
  try {
    const { code, state } = req.query;

    console.log('code', code);

    // 根据获取到的code获取授权码
    const { data: tokenInfo } = await request.post('/open/token', {
      client_id: 'foo',
      client_secret: 'bar',
      redirect_uri: `${clientUrl}/cb`,
      code,
      grant_type: 'authorization_code',
    });

    console.log('tokenInfo', tokenInfo);

    const { access_token, expires_in, id_token, scope, token_type } = tokenInfo;

    console.log('access_token', access_token);

    const { data: userInfo } = await request.post('/open/me', {
      access_token,
    });

    res.json({ userInfo });
  } catch (err) {
    console.error(err.response.data);
    next(err);
  }
});

app.listen(port, () => {
  console.log(`Demo app listening on port ${port}`);
});
