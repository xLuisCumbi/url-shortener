async function shortenUrl() {
    const originalUrl = document.getElementById('originalUrl').value;
    const response = await fetch('/shorten', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: originalUrl }),
    });
    const data = await response.json();
    document.getElementById('result').innerHTML = `URL acortada: <a href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>`;
}