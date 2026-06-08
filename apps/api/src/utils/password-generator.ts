import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export const generatePassword = (length = 12): string => {
    let result = "";
    for (let index = 0; index < length; index += 1) {
        result += ALPHABET.charAt(randomInt(ALPHABET.length));
    }
    return result;
};