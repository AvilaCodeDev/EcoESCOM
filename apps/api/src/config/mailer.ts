import nodemailer from "nodemailer";
import { env } from "./env";

const transport = env.SMTP_HOST
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined
    })
    : nodemailer.createTransport({ jsonTransport: true });

export interface MailMessage {
    to: string;
    subject: string;
    text: string;
}

export const sendMail = async (message: MailMessage): Promise<void> => {
    const info = await transport.sendMail({
        from: env.MAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text
    });

    if (env.NODE_ENV !== "production") {
        console.log("Correo (dev):", JSON.stringify(info));
    }
};