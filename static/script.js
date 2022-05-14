function updateTime() {
    let current = new Date();
    let time = current.toLocaleTimeString(); // "2:42:07 PM"
    document.getElementById('current-time').innerHTML = time;
}

setInterval(updateTime, 1000);