import fetch from "node-fetch";

const baseLatitude = 12.9716;
const baseLongitude = 77.5946;

const BACKEND_URL = process.env.VITE_BACKEND_URL || "http://localhost:5000";
const endpoint = `${BACKEND_URL}/api/device/location`;
const deviceId = "345678901212345"; 

function randomOffset() {
    return +(Math.random() * 0.40004 - 0.20002).toFixed(6); // ±0.20002
}

function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function formatTime(date) {
    return date.toTimeString().split(" ")[0];
}

async function sendLocation() {
    const now = new Date();

    const payload = {
        deviceName: deviceId,
        latitude: +(baseLatitude + randomOffset()).toFixed(6),
        longitude: +(baseLongitude + randomOffset()).toFixed(6),
        date: "2025-04-13",
        time: "12:00:00",
        inputVoltage: 1,
        batteryVoltage: Math.floor(Math.random() * 101),
        homeLatitude: 13.0,
        homeLongitude: 77.0,
        radius: 2.1,
        alert: 0,
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error("Server responded with status:", response.status);
            return;
        }
        console.log("Request Sent Succefully")
        const data = await response.json();
    } catch (err) {
        console.error("Error sending location:", err);
    }
}

sendLocation();
setInterval(sendLocation, 5000);
