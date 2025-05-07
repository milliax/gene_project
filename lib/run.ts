import { spawn } from 'child_process';


export async function runPython(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // print directory
        console.log('Current directory:', process.cwd());
        const py = spawn('python', [path]);

        py.on('error', (err) => reject(err));

        py.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Python exited with code ${code}`));
            }
        });
    });
}