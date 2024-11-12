import { MosConnection } from "../MosConnection";
import { getMosConnection, setupMocks } from "./lib";
import { NCSServerConnection } from "../connection/NCSServerConnection";

describe('Hot Standby Feature', () => {
    let mosConnection: MosConnection;
    let primary: NCSServerConnection | null;
    let secondary: NCSServerConnection | null;

    beforeAll(() => {
        setupMocks();
    });

    beforeEach(async () => {
        mosConnection = await getMosConnection({
            '0': true,
            '1': true,
        }, false);

        const device = await mosConnection.connect({
            primary: {
                id: 'primary',
                host: '127.0.0.1',
            },
            secondary: {
                id: 'secondary',
                host: '127.0.0.2',
                isHotStandby: true
            }
        });

        // Wait for connections to be established
        await new Promise(resolve => setTimeout(resolve, 100));

        primary = device['_primaryConnection'];
        secondary = device['_secondaryConnection'];
    });

    test('should disable secondary heartbeats when primary is connected', async () => {
        expect(primary).toBeTruthy();
        expect(secondary).toBeTruthy();

        if (primary && secondary) {
            expect(primary.isHearbeatEnabled()).toBe(true);
            expect(secondary.isHearbeatEnabled()).toBe(false);
        }
    });

    test('should enable secondary heartbeats when primary disconnects', async () => {
        expect(primary).toBeTruthy();
        expect(secondary).toBeTruthy();

        if (primary && secondary) {
            // Simulate primary disconnect
            await primary.dispose();

            // Wait for primary to disconnect
            await new Promise(resolve => setTimeout(resolve, 100));
                        
            // Verify heartbeat states switched correctly
            expect(secondary.isHearbeatEnabled()).toBe(true);
            expect(primary.isHearbeatEnabled()).toBe(false);
        }
    });

    test('should disable primary heartbeasts when secondary is connected and primary is disconnected', async () => {
        expect(primary).toBeTruthy();
        expect(secondary).toBeTruthy();

        if (primary && secondary) {
            // Simulate primary disconnect
            await primary.dispose();

            // Wait for primary to disconnect
            await new Promise(resolve => setTimeout(resolve, 100));

            // Wait for secondary to connect
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify heartbeat states switched correctly
            expect(secondary.isHearbeatEnabled()).toBe(true);
            expect(primary.isHearbeatEnabled()).toBe(false);
        }
    })

    test('should handle rapid primary connection changes', async () => {
        expect(primary).toBeTruthy();
        expect(secondary).toBeTruthy();

        if (primary && secondary) {
            const connectionStates: boolean[] = [];
            
            // Rapidly toggle primary connection
            for (let i = 0; i < 5; i++) {
                await primary.dispose();
                await new Promise(resolve => setTimeout(resolve, 50));
                primary.connect();
                await new Promise(resolve => setTimeout(resolve, 50));
                
                connectionStates.push(
                    secondary.connected,
                    primary.connected
                );
            }

            // Verify states remained consistent
            connectionStates.forEach((state, i) => {
                if (i % 2 === 0) {
                    expect(state).toBe(false); // Secondary should be disabled
                } else {
                    expect(state).toBe(true);  // Primary should be enabled
                }
            });
        }
    });

    afterEach(async () => {
        if (mosConnection) {
            await mosConnection.dispose();
        }
    });
});