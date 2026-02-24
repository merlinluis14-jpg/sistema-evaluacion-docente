import { prisma } from "./src/lib/prisma";

async function test() {
    try {
        const user = await prisma.user.findUnique({
            where: { username: "122030001" }
        });
        console.log("Found user:", user);
    } catch (e) {
        console.error("Error finding user:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
