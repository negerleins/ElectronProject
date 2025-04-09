// Resources
import fs from 'fs';
import os from 'os';
import osUtils from 'os-utils'
import process from 'process';
import { ipcWebContentsSend } from './util.js';

// Constants
const PULLING_INTERVAL = 500

// Function to pull system resources
export function pullResources(mainWindow) {
    setInterval(async () => {
        try {
            const getUsage = await getStaticData();

            ipcWebContentsSend("statistics", mainWindow, getUsage);
        } catch (error) {
            console.error('Error while pulling/sending resources:', error);
        }
    }, PULLING_INTERVAL);
}

// Static function to get usage
export function getStaticData() {
    return Promise.all([getCpu(), getRam(), getDisk()]).then(([cpuUsage, ramUsage, diskUsage]) => {
        const totalMemory = Math.floor(osUtils.totalmem() / 1024);

        // Ensure we're only sending serializable data
        return {
            data: {
                cpu: {
                    usage: Number(cpuUsage.data.usage),
                    model: String(cpuUsage.data.model)
                },
                ram: {
                    usage: Number(ramUsage.data),
                    total: Number(totalMemory)
                },
                disk: {
                    total: Number(diskUsage.data.total),
                    free: Number(diskUsage.data.free),
                    usage: Number(diskUsage.data.usage)
                }
            },
            success: true,
            message: 'Usage retrieved successfully'
        };
    }).catch(error => {
        return {
            success: false,
            message: String(error.message),
            data: null
        };
    });
}

// Function to get CPU usage
function getCpu() {
    return new Promise((resolve, reject) => {
        osUtils.cpuUsage((current) => {
            const model = os.cpus()[0].model;

            if (current) {
                resolve({
                    data: {
                        usage: current,
                        model: model,
                    },
                    success: true,
                    message: 'CPU usage retrieved successfully'
                });
            } else {
                reject({
                    message: 'Failed to get CPU usage',
                    success: false
                });
            }
        });
    });
}

// Function to get RAM usage
function getRam() {
    return new Promise((resolve, reject) => {
        const current = (1 - osUtils.freememPercentage());

        if (current) {
            resolve({
                data: current,
                success: true,
                message: 'RAM usage retrieved successfully'
            });
        } else {
            reject({
                message: 'Failed to get RAM usage',
                success: false
            });
        }
    });
}

function getDisk() {
    return new Promise((resolve, reject) => {
        const stats = fs.statfsSync(process.platform === 'win32' ? 'C://' : '/')
        const total = stats.bsize * stats.blocks;
        const free = stats.bsize * stats.bfree;

        if (total && free) {
            const current = Math.floor(total / 1_000_000_000);
            const usage = (1 - free / total);

            resolve({
                data: {
                    total: current,
                    free: Math.floor(free / 1_000_000_000),
                    usage: usage
                },
                success: true,
                message: 'Disk usage retrieved successfully'
            });
        } else {
            reject({
                message: 'Failed to get Disk usage',
                success: false
            });
        }
    });
}
