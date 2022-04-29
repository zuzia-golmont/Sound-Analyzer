const canvasDiv = document.getElementById('canvasDiv');
let canvas_ctx;
let factor = 1;

let audio_ctx;
let currentBuffer;
let frequencyData = []; 
let labels = [];


let przycisk = document.getElementById("start");

class F { 
    constructor(n) {
        let real = new Array(n);
        let imag = new Array(n);
        for (let i = 0; i < n; i++) {
            real[i] = 0;
            imag[i] = 0;
        }
        this.real = real;
        this.imag = imag;
    }
}

function fftWrapper(x) { //funkcja zbierajaca w jedno wszystkie 'skladowe funkcje'
    let arr = x.getChannelData(0); 
    let k = 1;
    while (k < audio_ctx.sampleRate) k *= 2;  
    if (arr.length > k) {
        arr = arr.slice(0, k);
    }
    let arr2 = new Float32Array(k);
    for (let i = 0; i < arr.length; i++) {
        arr2[i] = arr[i];
    }
    let transform = fft(arr2, k); 
    grabFrequencyData(transform); 
    displaySound(frequencyData); 
}

function fft(x, n, s = 1) {
    let f = new F(n); 
    if (n === 1) { 
        f.real[0] = x[0];
        f.imag[0] = 0;
    }
    else {
        let f2 = new F(n);
        f.real = f.real.slice(0, n / 2);
        f.imag = f.imag.slice(0, n / 2);
        f = fft(x, n / 2, 2 * s);
        f2 = fft(x.slice(s, x.length), n / 2, 2 * s);
        for (let k = 0; k < n / 2; k++) {
            let preal = f.real[k];
            let pimag = f.imag[k];
            let qreal = f2.real[k] * Math.cos(Math.PI * 2 * k / n) + f2.imag[k] * Math.sin(Math.PI * 2 * k / n);
            let qimag = f2.imag[k] * Math.cos(Math.PI * 2 * k / n) - f2.real[k] * Math.sin(Math.PI * 2 * k / n);
            f.real[k] = preal + qreal;
            f.imag[k] = pimag + qimag;
            f2.real[k] = preal - qreal;
            f2.imag[k] = pimag - qimag;
        }
        f.real = f.real.concat(f2.real);
        f.imag = f.imag.concat(f2.imag);
    }
    return f;
}


przycisk.addEventListener('click', function (e) { 
    if (!audio_ctx) audio_ctx = new AudioContext; 
    e.preventDefault;
    loadSound("G_2.mp3");

});

function loadSound(url) {
    let req = new XMLHttpRequest(); 
    req.open("GET", url, true);
    req.responseType = "arraybuffer";
    req.onreadystatechange = function (e) { 
        if (req.readyState == 4) {
            if (req.status == 200)
                audio_ctx.decodeAudioData(req.response, 
                    function (buffer) { 
                        fftWrapper(buffer);
                    }, Error); 
            else
                alert('error during the load.Wrong url or cross origin issue');
        }
    };
    req.send();
}


function Error() {
    console.log("Blad"); 
}

function grabFrequencyData(array) { 
    for (let i = 0; i < array.real.length; i++) {
        frequencyData.push(Math.sqrt(Math.pow(array.real[i], 2) + Math.pow(array.imag[i], 2)));
    }
}


function displaySound(array) { //rysowanie grafu
    canvasDiv.innerHTML = '';
    let canv = document.createElement('canvas');
    canv.style.width = '800';
    canv.style.height = '300';
    canvas_ctx = canv.getContext('2d');
    canvasDiv.appendChild(canv);
    labels = [];
    for (let i = 0; i < array.length; i++) {
        labels.push(Math.round((i * (audio_ctx.sampleRate / factor) / array.length)*100)/100);
    }
    let chart = new Chart(canvas_ctx, {
        type: 'line',
        fill: false,
        data: {
            labels: labels,
            datasets: [{
                data: array,
                borderColor: 'rgb(75, 192, 192)'
            }]
        }
    });
}

document.getElementById('zoomin').addEventListener('click', () => {
    factor *= 2;
    displaySound(frequencyData.slice(0, frequencyData.length / factor));
});
document.getElementById('zoomout').addEventListener('click', () => {
    factor /= 2;
    displaySound(frequencyData.slice(0, frequencyData.length / factor));
});

