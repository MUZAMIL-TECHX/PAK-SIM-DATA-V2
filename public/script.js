const numberInput = document.getElementById('numberInput');
const searchBtn = document.getElementById('searchBtn');
const results = document.getElementById('results');

async function searchNumber() {
    const number = numberInput.value.trim().replace(/\D/g, '');

    if (!number) {
        results.innerHTML = `<div class="status error">❌ Please enter a number</div>`;
        return;
    }

    if (number.length < 10 || number.length > 13) {
        results.innerHTML = `<div class="status error">❌ Invalid number. Must be 10–13 digits.</div>`;
        return;
    }

    results.innerHTML = `<div class="status loading"><span class="loader"></span> Searching database...</div>`;

    try {
        const res = await fetch(`/search?number=${encodeURIComponent(number)}`);
        const data = await res.json();

        if (!data.ok || !data.data || data.data.length === 0) {
            results.innerHTML = `<div class="status error">❌ ${data.error || 'No record found'}</div>`;
            return;
        }

        results.innerHTML = data.data.map((item, i) => `
            <div class="result-card" style="animation-delay: ${i * 0.08}s">
                <div class="row">
                    <span class="label">📱 Number</span>
                    <span class="value number">${item.number}</span>
                </div>
                <div class="row">
                    <span class="label">👤 Name</span>
                    <span class="value name">${item.name}</span>
                </div>
                <div class="row">
                    <span class="label">🆔 CNIC</span>
                    <span class="value cnic">${item.cnic}</span>
                </div>
                <div class="row">
                    <span class="label">📍 Address</span>
                    <span class="value">${item.address}</span>
                </div>
            </div>
        `).join('');

    } catch (err) {
        results.innerHTML = `<div class="status error">❌ Network error: ${err.message}</div>`;
    }
}

searchBtn.addEventListener('click', searchNumber);
numberInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchNumber();
});
