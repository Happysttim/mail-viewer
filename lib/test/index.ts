import { ImapCommandMap, Pop3CommandMap } from "lib/command";
import { createQuery } from "lib/command/imap";
import { addUser, createUserTable, user } from "lib/database";
import { MailDTO, UserDTO } from "lib/database/dto";
import { ImapParser, Pop3Parser } from "lib/parser";
import { StreamManager } from "lib/stream/network";
import { ImapTransform, Pop3Transform } from "lib/stream/transform";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local.test" });

const pop3Host = process.env.POP3_HOST ?? "";
const pop3Port = parseInt(process.env.POP3_PORT ?? "995");
const imapHost = process.env.IMAP_HOST ?? "";
const imapPort = parseInt(process.env.IMAP_PORT ?? "993");
const mailID = process.env.MAIL_ID ?? "";
const mailPassword = process.env.MAIL_PASSWORD ?? "";

(async() => {
    const userKim: UserDTO = {
        id: "kim_id",
        password: "Password"
    };

    // 유저 테이블 만들기
    await createUserTable();
    // 유저 등록
    await addUser(userKim);
    // 유저 서비스 객체 받아오기
    const userService = await user(userKim);

    if (userService === undefined) {
        console.log("userService is undefined");
        return;
    }

    // 스트림 관리자 생성
    const streamManager = new StreamManager();

    // IMAP, POP3 스트림 등록
    streamManager.register(
        ImapCommandMap,
        {
            commandTransform: new ImapTransform("TAG"),
            parser: new ImapParser("TAG"),
        }
    );
    streamManager.register(
        Pop3CommandMap,
        {
            commandTransform: new Pop3Transform(),
            parser: new Pop3Parser()
        }
    );

    // IMAP, POP3 서버 연결 및 데이터베이스에 데이터 집어넣기
    // createStream => MailNetwork 를 반환함, 3번째 파라미터(스트림 ID)를 안넣으면 새로운 UID를 생성함
    const imapStream = await streamManager.createStream(
        ImapCommandMap,
        {
            hostname: imapHost,
            port: imapPort,
            secure: true,
            tls: {
                rejectUnauthorized: true,
            }
        }
    );

    const pop3Stream = await streamManager.createStream(
        Pop3CommandMap,
        {
            hostname: pop3Host,
            port: pop3Port,
            secure: true,
            tls: {
                rejectUnauthorized: true,
            }
        }
    );

    if (imapStream === undefined || pop3Stream === undefined) {
        console.log("imapStream or pop3Stream is undefined");
        return;
    }

    // 새로운 스트림 등록
    await userService.createStream({
        streamId: imapStream.id,
        protocol: "imap",
        mailId: mailID,
        mailPassword: mailPassword,
        host: imapHost,
        port: 993,
    });

    await userService.createStream({
        streamId: pop3Stream.id,
        protocol: "pop3",
        mailId: mailID,
        mailPassword: mailPassword,
        host: pop3Host,
        port: 995,
    });

    // IMAP, POP3 메일 서비스 받아오기
    const imapMailService = await userService.address(imapStream.id);
    const pop3MailService = await userService.address(pop3Stream.id);

    // IMAP, POP3 메일 데이터 받아오기
    // const imapStream = streamManager.stream<ImapCommandMap>(streamID);
    // const pop3Stream = streamManager.stream<Pop3CommandMap>(streamID);

    if (imapMailService === undefined || pop3MailService === undefined) {
        console.log("imapMailService or pop3MailService is undefined");
        return;
    }

    await imapStream.connect();
    await pop3Stream.connect();

    const imapHandler = imapStream.handler();
    const pop3Handler = pop3Stream.handler();

    if (imapHandler === undefined || pop3Handler === undefined) {
        console.log("imapHandler or pop3Handler is undefined");
        return;
    }

    // IMAP의 로그인
    const imapLoginResult = await imapHandler.command("login").execute(mailID, mailPassword);
    if (imapLoginResult.schema.error) {
        console.log("IMAP 로그인 실패");
        return;
    }

    // POP3의 로그인
    const pop3LoginResult = await pop3Handler.command("user").execute(mailID).then((_) => {
        return pop3Handler.command("pass").execute(mailPassword);
    });
    
    if (pop3LoginResult.schema.error) {
        console.log("POP3 로그인 실패");
        return;
    }

    // IMAP 의 메일 박스 선택
    await imapHandler.command("select").execute("inbox");
    // IMAP 의 메일 목록 받아오기 (1..10)
    // IMAP 의 메일 UID 받아오기
    const imapMailUIDs = await imapHandler.command("uid").execute("SEARCH", createQuery().range("1:10"));

    if (!imapMailUIDs.schema.result) {
        console.log("IMAP UID 실패");
        return;
    }

    if (imapMailUIDs.schema.result.uidResult.arg === "SEARCH") {
        const imapUIDs = imapMailUIDs.schema.result.uidResult.searchResult?.searchResult ?? [];
        for (const uid of imapUIDs) {
            const imapFetchHeader = await imapHandler.command("uid").execute("FETCH", {
                peek: "RFC822.HEADER",
                range: `${uid}`,
            });

            const imapFetchFlag = await imapHandler.command("uid").execute("FETCH", {
                peek: "FLAGS",
                range: `${uid}`,
            });

            const headerResult = imapFetchHeader.schema.result;
            const flagsResult = imapFetchFlag.schema.result;

            if (headerResult?.uidResult.arg === "FETCH" && headerResult?.uidResult.fetch?.fetchResult.fetchType === "RFC822.HEADER"
                && flagsResult?.uidResult.arg === "FETCH" && flagsResult?.uidResult.fetch?.fetchResult.fetchType === "FLAGS"
            ) {
                const { header } = headerResult.uidResult.fetch.fetchResult.fetchHeader[0];
                const { flagSchema } = flagsResult.uidResult.fetch.fetchResult.fetchFlag[0];
                const { date, from, subject } = header;
                // IMAP 서비스에 데이터 집어넣기
                const mailDto: MailDTO = {
                    streamId: imapMailService.stream.streamId,
                    date,
                    fromAddress: from,
                    subject,
                    isSeen: flagSchema.flags.includes("\\Seen"),
                    uid: uid.toString(),
                    mailId: 0,
                };
                await imapMailService.newMail(mailDto);
            }
        }
    }

    // POP 의 메일 목록 받아오기 (1..10)
    // POP 의 메일 UID 받아오기
    for (let i = 1; i <= 10; i++) {
        const uidl = await pop3Handler.command("uidl").execute(i);
        if (uidl.schema.result) {
            const uid = uidl.schema.result[0].uid;
            const retr = await pop3Handler.command("retr").execute(i);
            if (retr.schema.result) {
                const { date, from, subject } = retr.schema.result;
                // POP3 서비스에 데이터 집어넣기
                const mailDto: MailDTO = {
                    streamId: pop3MailService.stream.streamId,
                    date,
                    fromAddress: from,
                    subject,
                    isSeen: false,
                    uid,
                    mailId: 0,
                };
                await pop3MailService.newMail(mailDto);
            }
        }
    }

    // IMAP 서비스의 모든 메일 데이터 받아오기
    console.log("IMAP의 메일 데이터");
    (await imapMailService.all()).forEach((mailDto) => {
        console.log(JSON.stringify(mailDto, null, 2));
    });

    console.log("POP3의 메일 데이터");
    (await pop3MailService.all()).forEach((mailDto) => {
        console.log(JSON.stringify(mailDto, null, 2));
    });

    imapStream.disconnect();
    pop3Stream.disconnect();

})();