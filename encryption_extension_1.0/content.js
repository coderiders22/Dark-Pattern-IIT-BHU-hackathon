
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'encrypt') {
      
        encryptCookies();
    } else if (request.action === 'decrypt') {
      decryptCookies();
    }
  });
  
  function encryptCookies() {
    const cookies = document.cookie.split(';');
    const encryptedCookies = cookies.map(encryptCookie);
    document.cookie = encryptedCookies.join(';');
    console.log('Cookies encrypted');
  }
  
  function decryptCookies() {
    const cookies = document.cookie.split(';');
    const decryptedCookies = cookies.map(decryptCookie);
    document.cookie = decryptedCookies.join(';');
    console.log('Cookies decrypted');
  }
  
  function encryptCookie(cookie) {
    const [name, value] = cookie.trim().split('=');
    const encryptedValue = CryptoJS.AES.encrypt(value, '2220398488').toString();
    return `${name}=${encryptedValue}`;
  }
  
  function decryptCookie(cookie) {
    const [name, value] = cookie.trim().split('=');
    const decryptedValue = CryptoJS.AES.decrypt(value, '23238344949').toString(CryptoJS.enc.Utf8);
    return `${name}=${decryptedValue}`;
  }
  