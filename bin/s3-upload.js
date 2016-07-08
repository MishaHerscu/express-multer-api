'use strict';

// process.env is where we have acess to the .env content
require('dotenv').config();

const fs = require('fs');
const crypto = require('crypto');

const fileType = require('file-type');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

let filename = process.argv[2] || '';

const mimeType = (data) => {
  return Object.assign({
    ext: 'bin',
    mime: 'application/octet-stream'
  }, fileType(data));
};

const randomeHexString = (length) => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(length, (error, buffer) => {
      if(error){
        reject(error);
      }
      resolve(buffer.toString('hex'));
    });
  });
};

const awsUpload = (file) => {
  return randomeHexString(16)
  .then((filename) => {
    let dir = new Date().toISOString().split('T')[0];
    return {
      ACL: "public-read",
      Body: file.data,
      Bucket: 'wdi-12-mh-storage',
      ContentType: file.mime,
      Key: `${dir}/${filename}.${file.ext}`
    };
  })
  .then((options) => {
    return new Promise((resolve, reject) => {
      s3.upload(options, function(error, data){
        if (error) {
          reject(error);
        }

        resolve(data);
      });
    });
  });
};

const readFile = (filename) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (error, data) => {
      if(error){
        reject(error);
      }

      resolve(data);
    });
  });
};

readFile(filename)
.then((data) => {
  let file = mimeType(data);
  file.data = data;
  return file;
})
.then(awsUpload)
.then(console.log)
.catch(console.error);
