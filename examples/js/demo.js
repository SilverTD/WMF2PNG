const file = document.getElementById('files');

file.onchange = async function() {
    const png = await WMF2PNG.getPNG(file.files[0]);
    document.getElementById('img').innerHTML = png;
}
