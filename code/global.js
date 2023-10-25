function setCookie(name, value, daysToExpire = 30) {
  const date = new Date();
  date.setTime(date.getTime() + (daysToExpire * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/;SameSite=Strict";
}
function getCookie(name) {
  const cookieName = name + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return null;
}

async function hardReload() {
	await fetch(window.location.href, {
		headers: {
			Pragma: 'no-cache',
			Expires: '-1',
			'Cache-Control': 'no-cache',
		},
	});
	window.location.href = url;
	window.location.reload();
}

fetch('https://api.nmll.site/v1/minesweeper/v')
.then(r => r.json())
.then(v => {
	if (v.hash != getCookie('last_hash')) {   // get last git hash and reload if it does not match cached value
		setCookie('last_hash', v.hash);         // should fix not matching html and code files on updates
		hardReload();                           // but when switching to v1.0 should replace by query parameters
	}                                         // TODO
})