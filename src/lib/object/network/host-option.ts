export interface Tls {
    rejectUnauthorized?: boolean | undefined
}

export interface HostOption {
    hostname: string
    port: number
    secure: boolean
    tls?: Tls | undefined
}