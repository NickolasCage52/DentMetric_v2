export const CAR_PARTS = {
    door: {
        id: 'door',
        name: 'Дверь',
        icon: 'door',
        path: 'M20,20 L280,20 Q300,20 300,50 L300,350 Q300,380 280,380 L20,380 Q0,380 0,350 L0,50 Q0,20 20,20 Z',
        // Ribs visible: red with opacity
        ribs: [
            { x: 0, y: 150, w: 300, h: 20 },
            { x: 0, y: 320, w: 300, h: 30 }
        ]
    },
    hood: {
        id: 'hood',
        name: 'Капот',
        icon: 'hood',
        path: 'M50,20 L250,20 Q280,20 290,100 L300,350 Q300,380 150,390 Q0,380 0,350 L10,100 Q20,20 50,20 Z',
        ribs: [
            { x: 140, y: 20, w: 20, h: 370 },
            { x: 50, y: 100, w: 200, h: 20 }
        ]
    },
    fender: {
        id: 'fender',
        name: 'Крыло',
        icon: 'fender',
        path: 'M20,20 L250,20 Q280,20 280,100 L280,350 Q150,250 20,350 L20,20 Z',
        ribs: [
            { x: 20, y: 180, w: 260, h: 40 }
        ]
    },
    trunk: {
        id: 'trunk',
        name: 'Багажник',
        icon: 'trunk',
        path: 'M20,20 L280,20 L280,350 L20,350 Z',
        ribs: [
            { x: 0, y: 200, w: 300, h: 30 }
        ]
    }
};
