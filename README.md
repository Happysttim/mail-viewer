# mail-viewer
POP3, IMAP 으로 메일 계정들의 메일을 볼 수 있는 프로그램 입니다.   

## 사용한 주요 라이브러리   
- __Typescript__ `^5.6.2`
- __React__ `^18.3.1`
- __Electron__ `^35.0.1`
- __Zod__ `^3.23.8`
- __better-sqlite3-multiple-sqlcipher__ `^11.8.1`
- __uid__ `^2.0.2`

## TODO
1. [x] __IMAP / POP3 라이브러리 작성__

    - [x] CommandMap 작성
  
    - [x] Parser 작성
  
    - [x] Receiver 작성
  
    - [x] Zod 스키마 작성
  
    - [x] sqlite3 서비스 작성
  
2. [ ] __Electron renderer 작성__