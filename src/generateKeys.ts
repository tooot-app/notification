import crypto from 'crypto'

const generateKeys = (): { pub: string; auth: string } => {
  const keyCurve = crypto.createECDH('prime256v1')
  keyCurve.generateKeys()
  const publicKey = keyCurve.getPublicKey()
  // const privateKey = keyCurve.getPrivateKey()
  const auth = crypto.randomBytes(16)

  //   console.log('pub 64', publicKey.toString('base64'))
  // console.log( "private key="+ base64us.encode(privateKey));
  //   console.log('auth 64', auth.toString('base64'))

  return { pub: publicKey.toString('base64'), auth: auth.toString('base64') }
}

export default generateKeys

/*
function decodeBase64(src){
    return new Buffer(src,'base64').toString('UTF-8')
}

console.log("JWT Info="+decodeBase64('eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9'))
console.log("JWT Data="+decodeBase64('eyJhdWQiOiJodHRwczovL21hc3RvZG9uLW1zZy5qdWdnbGVyLmpwIiwiZXhwIjoxNTI2MTMzNTA4LCJzdWIiOiJtYWlsdG86In0'))
*/
