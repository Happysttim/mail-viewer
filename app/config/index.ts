import { Observe } from "app/type";

export const observe: Observe = {
    login: {
        id: "",
        password: "",
    },
    streamId: "",
};

export const getObserve = () => observe;