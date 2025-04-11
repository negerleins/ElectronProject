import { useEffect, useState, useCallback } from "react";
import "./styles/app.css";
import { ThemeComponent } from "./exports/theme-picker";
import { toast } from "sonner";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

function App() {
  const [pairedDevices, setPairedDevices] = useState([]);
  const [newDevices, setNewDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [pairingDevice, setPairingDevice] = useState(null);
  const [connectingDevice, setConnectingDevice] = useState(null);

  // Fetch current/paired devices only
  const fetchPairedDevices = async () => {
    try {
      const response = await window.electron.bluetooth.getPairedDevices();
      if (response.success && Array.isArray(response.devices)) {
        setPairedDevices(response.devices);
        setError(null);
      } else {
        throw new Error(response.error || "Failed to fetch paired devices");
      }
    } catch (err) {
      setError(err.message);
      setPairedDevices([]);
      console.error("Error fetching paired devices:", err);
    }
  };

  const startNewDeviceScan = async () => {
    try {
      setScanning(true);
      const result = await window.electron.bluetooth.startScan();

      if (!result.success) {
        throw new Error(result.error || "Failed to start scan");
      }

      toast.success("Started scanning for new devices");
    } catch (err) {
      setScanning(false);
      setError(err.message);
      toast.error(`Scan failed: ${err.message}`);
    }
  };

  const stopNewDeviceScan = async () => {
    try {
      const result = await window.electron.bluetooth.stopScan();
      if (!result.success) {
        throw new Error(result.error);
      }
      toast.success("Stopped scanning");
    } catch (err) {
      toast.error(`Failed to stop scan: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handlePairDevice = async (deviceId) => {
    try {
      setPairingDevice(deviceId);
      const result = await window.electron.bluetooth.pairDevice(deviceId);
      if (result.success) {
        toast.success("Device paired and connected successfully");
        await fetchPairedDevices(); // Wait for paired devices to update
        setNewDevices((prev) => prev.filter((d) => d.id !== deviceId));
      } else {
        throw new Error(result.error || "Failed to pair device");
      }
    } catch (err) {
      toast.error(`Pairing failed: ${err.message}`);
    } finally {
      setPairingDevice(null);
    }
  };

  const handleConnectDevice = async (deviceId) => {
    try {
      setConnectingDevice(deviceId);
      const result = await window.electron.bluetooth.connectDevice(deviceId);
      if (result.success) {
        toast.success("Device connected successfully");
        await fetchPairedDevices();
      } else {
        throw new Error(result.error || "Failed to connect device");
      }
    } catch (err) {
      toast.error(`Connection failed: ${err.message}`);
    } finally {
      setConnectingDevice(null);
    }
  };

  const handleUnpairDevice = async (deviceId) => {
    try {
      const result = await window.electron.bluetooth.unpairDevice(deviceId);
      if (result.success) {
        toast.success("Device unpaired successfully");
        // Refresh the paired devices list after unpairing
        fetchPairedDevices();
      } else {
        throw new Error(result.error || "Failed to unpair device");
      }
    } catch (err) {
      toast.error(`Unpairing failed: ${err.message}`);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    try {
      const result = await window.electron.bluetooth.removeDevice(deviceId);
      if (result.success) {
        toast.success("Device removed successfully");
        fetchPairedDevices();
      } else {
        throw new Error(result.error || "Failed to remove device");
      }
    } catch (err) {
      toast.error(`Remove failed: ${err.message}`);
    }
  };

  // Handle new device discovery
  useEffect(() => {
    const handler = (device) => {
      setNewDevices((prev) => {
        // Only add if not already in paired devices and not already in new devices
        if (
          !pairedDevices.some((d) => d.id === device.id) &&
          !prev.some((d) => d.id === device.id)
        ) {
          return [...prev, device];
        }
        return prev;
      });
    };

    window.electron.bluetooth.onNewDevice(handler);
  }, [pairedDevices]);

  // Initial fetch of paired devices
  useEffect(() => {
    fetchPairedDevices();
  }, []);

  // List component for paired/known devices
  function List() {
    return (
      <Carousel className="w-full max-w-sm">
        <Button onClick={fetchPairedDevices} className="mb-4 w-full">
          Refresh Devices
        </Button>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <CarouselContent>
          {pairedDevices.length === 0 ? (
            <CarouselItem>
              <p className="text-center py-4">No paired devices found</p>
            </CarouselItem>
          ) : (
            pairedDevices.map((device) => (
              <CarouselItem key={device.id}>
                <div className="device-item p-4 border rounded-lg">
                  <h3 className="text-lg font-semibold">
                    {device.name || "Unknown Device"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">MAC: {device.id}</p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() =>
                        device.paired
                          ? handleUnpairDevice(device.id)
                          : handlePairDevice(device.id)
                      }
                      disabled={
                        pairingDevice === device.id ||
                        connectingDevice === device.id
                      }
                    >
                      {pairingDevice === device.id
                        ? "Pairing..."
                        : device.paired
                        ? "Unpair"
                        : "Pair"}
                    </Button>
                    {device.paired && !device.connected && (
                      <Button
                        onClick={() => handleConnectDevice(device.id)}
                        disabled={connectingDevice === device.id}
                      >
                        {connectingDevice === device.id
                          ? "Connecting..."
                          : "Connect"}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveDevice(device.id)}
                      className="flex-none"
                      disabled={
                        pairingDevice === device.id ||
                        connectingDevice === device.id
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))
          )}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
  }

  function DeviceScanner() {
    const [isOpen, setIsOpen] = useState(false);

    const handleStartScan = useCallback(async () => {
      if (scanning) return; // Prevent multiple scans

      try {
        setNewDevices([]); // Clear previous results
        await startNewDeviceScan();
      } catch (err) {
        console.error("Failed to start scan:", err);
        toast.error("Failed to start scan");
      }
    }, [scanning]);

    const handleStopScan = async () => {
      try {
        await stopNewDeviceScan();
      } catch (err) {
        console.error("Failed to stop scan:", err);
      }
    };

    return (
      <Drawer
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && scanning) {
            handleStopScan();
          }
          setIsOpen(open);
        }}
      >
        <DrawerTrigger asChild>
          <Button
            className="w-full max-w-sm mt-4"
            onClick={() => setIsOpen(true)}
          >
            Scan for new Devices
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>New Device Scanner</DrawerTitle>
            <DrawerDescription>
              {scanning
                ? "Scanning for new devices..."
                : "Press Start Scan to begin"}
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="p-4">
            {newDevices.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Found New Devices:</h3>
                {newDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <p className="font-medium">
                        {device.name || "Unknown Device"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {device.id}
                      </p>
                      {device.rssi && (
                        <p className="text-xs text-gray-500">
                          Signal: {device.rssi} dBm
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePairDevice(device.id)}
                      disabled={pairingDevice === device.id}
                    >
                      {pairingDevice === device.id ? "Pairing..." : "Pair"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4">
                {scanning
                  ? "Searching for devices..."
                  : "Press Start Scan to begin"}
              </p>
            )}
          </ScrollArea>
          <DrawerFooter>
            <Button
              className="w-full"
              variant={scanning ? "destructive" : "default"}
              onClick={scanning ? handleStopScan : handleStartScan}
              disabled={pairingDevice !== null}
            >
              {scanning ? "Stop Scan" : "Start Scan"}
            </Button>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                className="w-full mt-2"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div>
      <ThemeComponent />
      <div className="flex flex-col items-center justify-center min-h-svh">
        <List />
        <DeviceScanner />
      </div>
    </div>
  );
}

export default App;
