export const timeout = async <T>(func: () => Promise<T>, ms: number) => {
    let isRejected = false;
    let timer: NodeJS.Timeout;
    return new Promise<T>((resolve, reject) => {
        func().then((value) => {
            if (!isRejected) {
                clearTimeout(timer);
                resolve(value);
            }
        }).catch((err) => {
            if (!isRejected) {
                clearTimeout(timer);
                isRejected = true;
                reject(err);
            }
        });
        timer = setTimeout(() => {
            if (!isRejected) {
                isRejected = true;
                reject();
            }
        }, ms);
    });
};