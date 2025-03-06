import { ImapCommandMap } from "lib/command/imap";
import Pop3CommandMap from "lib/command/pop3";
import ImapParser from "lib/parser/imap";
import Pop3Parser from "lib/parser/pop3";
import StreamManager from "lib/stream/network/manager";
import ImapTransform from "lib/stream/transform/imap";
import Pop3Transform from "lib/stream/transform/pop3";

(async() => {
    
    const streamManager = new StreamManager();
    streamManager.register(
        ImapCommandMap,
        {
            commandTransform: new ImapTransform("TAG"),
            parser: new ImapParser("TAG"),
            prefix: "I"
        }
    );
    streamManager.register(
        Pop3CommandMap,
        {
            commandTransform: new Pop3Transform(),
            parser: new Pop3Parser(),
            prefix: "P"
        }
    );

    const streamImap = streamManager.createStream(
        ImapCommandMap,
        {
            hostname: "Imap Host",
            port: 993,
            secure: true,
            tls: {
                rejectUnauthorized: true
            }
        }
    );
    const streamPop3 = streamManager.createStream(
        Pop3CommandMap,
        {
            hostname: "Pop3 Host",
            port: 995,
            secure: true,
            tls: {
                rejectUnauthorized: true
            }
        }
    )

    if (!streamImap) {
        console.log("IMAP Stream is not created");
        return;
    }

    if (!streamPop3) {
        console.log("POP3 Stream is not created");
        return;
    }

    await streamImap.connect();
    await streamPop3.connect();

    const handlerImap = streamImap.handler();
    const handlerPop3 = streamPop3.handler();
    if (!handlerImap) {
        console.log("IMAP Handler is not created");
        return;
    }

    await handlerImap.command("login").execute("ID", "PASS");
    await handlerImap.command("select").execute("inbox");


    if (!handlerPop3) {
        console.log("POP3 Handler is not created");
        return;
    }

    await handlerPop3.command("user").execute("USER");
    await handlerPop3.command("pass").execute("PASS");
    await handlerPop3.command("stat").execute();
    await handlerPop3.command("retr").execute(1);

    await streamManager.flushAllHandler();

    streamImap.disconnect();
    streamPop3.disconnect();
    

})();