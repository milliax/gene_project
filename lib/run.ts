import { spawn } from 'child_process';

export async function runPython(path: string, arg?: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // print directory
        console.log('Current directory:', process.cwd());

        console.log("path", path, arg);

        let py = null;

        // const py = spawn('python', [path,]);

        if(arg){
            py = spawn('python', [path, arg]);
        }else{
            py = spawn('python', [path]);
        }

        py.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        py.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        py.on('error', (err) => {
            console.log('Error spawning Python process:', err);
            reject(err)
        });

        py.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Python exited with code ${code}`));
            }
        });
    });
}