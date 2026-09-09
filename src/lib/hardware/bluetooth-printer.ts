/**
 * Driver Web Bluetooth API untuk Printer Thermal ESC/POS (58mm / 80mm).
 * Berjalan di browser modern (Chrome, Edge, Opera) yang mendukung Web Bluetooth.
 */

// Tipe antarmuka Web Bluetooth GATT minimal agar TypeScript type-check lulus
interface BluetoothGattCharacteristic {
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
}

interface BluetoothGattService {
  getCharacteristics(): Promise<BluetoothGattCharacteristic[]>;
}

interface BluetoothGattServer {
  connected: boolean;
  connect(): Promise<BluetoothGattServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothGattService>;
}

interface BluetoothDeviceTarget extends EventTarget {
  name?: string;
  gatt?: BluetoothGattServer;
}

interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: {
    requestDevice(options: {
      filters: { services: string[] }[];
      optionalServices?: string[];
    }): Promise<BluetoothDeviceTarget>;
  };
}

// Service UUID umum printer thermal portable Bluetooth (ISSC, generic serial SPP, dll.)
const DAFTAR_SERVICE_PRINTER = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Standar printer service
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Microchip / ISSC transparent
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ae00-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
];

export interface StatusKoneksiPrinter {
  didukung: boolean;
  tersambung: boolean;
  namaPerangkat?: string;
}

let perangkatAktif: BluetoothDeviceTarget | null = null;
let karakteristikCetak: BluetoothGattCharacteristic | null = null;

export function apakahBluetoothDidukung(): boolean {
  if (typeof window === "undefined") return false;
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export function statusPrinter(): StatusKoneksiPrinter {
  const didukung = apakahBluetoothDidukung();
  const tersambung = Boolean(perangkatAktif?.gatt?.connected && karakteristikCetak);
  return {
    didukung,
    tersambung,
    namaPerangkat: perangkatAktif?.name || undefined,
  };
}

export async function putuskanPrinter(): Promise<void> {
  if (perangkatAktif?.gatt?.connected) {
    perangkatAktif.gatt.disconnect();
  }
  perangkatAktif = null;
  karakteristikCetak = null;
}

/**
 * Mencari dan menyambungkan printer thermal bluetooth lewat dialog Web Bluetooth
 */
export async function sambungkanPrinter(): Promise<BluetoothGattCharacteristic> {
  if (!apakahBluetoothDidukung()) {
    throw new Error(
      "Browser ini tidak mendukung Web Bluetooth API. Gunakan Chrome/Edge atau tombol Cetak Browser."
    );
  }

  // Jika sudah tersambung dan valid, langsung kembalikan
  if (perangkatAktif?.gatt?.connected && karakteristikCetak) {
    return karakteristikCetak;
  }

  try {
    const nav = navigator as NavigatorWithBluetooth;
    if (!nav.bluetooth) {
      throw new Error("API Web Bluetooth tidak ditemukan pada navigator browser.");
    }

    // Request device dialog browser
    const device = await nav.bluetooth.requestDevice({
      filters: [
        { services: DAFTAR_SERVICE_PRINTER },
      ],
      optionalServices: DAFTAR_SERVICE_PRINTER,
    });

    perangkatAktif = device;

    device.addEventListener("gattserverdisconnected", () => {
      karakteristikCetak = null;
    });

    if (!device.gatt) {
      throw new Error("GATT server tidak ditemukan pada perangkat Bluetooth.");
    }

    const server = await device.gatt.connect();

    // Telusuri services untuk mencari characteristic yang bisa di-write
    for (const sUuid of DAFTAR_SERVICE_PRINTER) {
      try {
        const service = await server.getPrimaryService(sUuid);
        const characteristics = await service.getCharacteristics();

        for (const char of characteristics) {
          if (
            char.properties.write ||
            char.properties.writeWithoutResponse
          ) {
            karakteristikCetak = char;
            return char;
          }
        }
      } catch {
        // Lanjut ke service berikutnya jika tidak cocok
      }
    }

    throw new Error(
      "Karakteristik penulisan (write) ESC/POS tidak ditemukan pada printer ini."
    );
  } catch (err: unknown) {
    const pesan = err instanceof Error ? err.message : String(err);
    if (pesan.includes("User cancelled")) {
      throw new Error("Pemilihan printer bluetooth dibatalkan.");
    }
    throw new Error(pesan);
  }
}

/**
 * Mengirim byte ESC/POS ke printer Bluetooth yang tersambung.
 * Dilengkapi chunking 128 bytes agar buffer BLE mikro-kontroler printer tidak meluap.
 */
export async function cetakViaBluetooth(
  data: Uint8Array,
  ukuranChunk = 128
): Promise<{ sukses: boolean; pesan?: string }> {
  try {
    const char = await sambungkanPrinter();

    // Kirim secara bertahap (chunked)
    for (let offset = 0; offset < data.length; offset += ukuranChunk) {
      const chunk = data.slice(offset, offset + ukuranChunk);
      if (char.properties.writeWithoutResponse && char.writeValueWithoutResponse) {
        await char.writeValueWithoutResponse(chunk);
      } else {
        await char.writeValue(chunk);
      }
      // Beri jeda 15ms antar-chunk untuk printer thermal lambat
      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    return { sukses: true };
  } catch (err: unknown) {
    const pesan = err instanceof Error ? err.message : "Gagal mencetak ke printer Bluetooth";
    return { sukses: false, pesan };
  }
}
