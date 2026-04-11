import { prisma } from "./src/lib/prisma";
import bcrypt from "bcryptjs";

async function test() {
    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: "Merlin" },
                    { email: "merlin@gmail.com" },
                    { email: { contains: "merlin", mode: "insensitive" } },
                    { username: { contains: "merlin", mode: "insensitive" } }
                ]
            }
        });
        console.log("Found user:", user);
        if (user) {
            console.log("Is active?", user.isActive);
            const passwordMatch = await bcrypt.compare("Admin123!", user.password);
            console.log("Password match for 'Admin123!':", passwordMatch);
        }
    } catch (e) {
        console.error("Error finding user:", e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
