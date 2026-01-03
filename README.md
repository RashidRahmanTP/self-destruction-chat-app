# Self-Destructing Chat Rooms

This project creates a fully functional self-destructing chat room application that meets the requirements of the GDSC NITC Web Development Induction task-1. The application shows skill in real-time web technologies through WebSocket communication, automatic room deletion based on a timer, and effective in-memory data management. Key features include user authentication, WhatsApp-style message layouts, live countdown timers, and support for multiple rooms at the same time. The application gracefully handles edge cases and includes proper memory cleanup to prevent leaks. 

Through this project, I gained hands-on experience in full-stack web development, event-driven design, and asynchronous JavaScript programming. I faced challenges like managing multiple independent timers, synchronizing state across clients, and implementing real-time UI updates. These challenges improved my problem-solving skills and deepened my understanding of distributed systems. The code structure is modular, making it easy to add features like end-to-end encryption, file sharing, or password-protected rooms. 

This application serves as a demonstration of technical skill and a basis for future development. Its real-world use includes temporary team collaboration, anonymous feedback sessions, and privacy-focused communication. Overall, the project offers a valuable learning experience in modern web development practices and real-time application design.

---

## Features

- Username-based login (no authentication required)
- Create multiple chat rooms with custom timers
- Rooms automatically self-destruct after expiry
- Real-time messaging using WebSockets
- Live room list with active user count
- Users are automatically kicked when a room expires
- No database — fully **in-memory** storage

---

##  Tech Stack

- **Backend:** Node.js, Express
- **Real-time Communication:** Socket.IO (WebSockets)
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Storage:** In-memory objects (no persistent DB)

---

## 📂 Project Structure
.
├── server.js
├── index.html
├── public/
│ ├── script.js
│ └── style.css
├── package.json
├── package-lock.json
└── README.md


---

## How It Works (High Level)

1. User enters a username
2. User creates or joins a chat room
3. Each room has a self-destruct timer
4. Messages are sent and received in real-time
5. When timer hits zero:
   - Room is deleted
   - Users are kicked out
   - Messages are destroyed

---
## Future Improvements

1.End-to-End Encryption (client-side encryption)
2.Message history per room until expiry
3.UI animations & transitions
4.Deployment on cloud (Render / Railway / Vercel)

---

##Outputs

Username Setting Page shows First

<img width="1004" height="615" alt="Screenshot 2026-01-03 171356" src="https://github.com/user-attachments/assets/31b5b195-dacc-425b-84b4-e3b86b64a861" />


After Entering Username

<img width="1804" height="869" alt="Screenshot 2026-01-03 171418" src="https://github.com/user-attachments/assets/188144fe-9508-49cd-9fcc-04554f1c3fe2" />


Creating a room with name GDSC inductions and duration of 2 minutes

<img width="1628" height="921" alt="Screenshot 2026-01-03 171522" src="https://github.com/user-attachments/assets/d008e3c3-c2aa-4e65-be06-43b014eb55da" />


Room shows up in the available Rooms list

<img width="1686" height="859" alt="Screenshot 2026-01-03 171537" src="https://github.com/user-attachments/assets/9f401458-3932-4704-a8b5-383e2546d9ca" />


Messages Sent by each person on their tab.

<img width="1641" height="899" alt="Screenshot 2026-01-03 171633" src="https://github.com/user-attachments/assets/e09af357-658a-4fdc-9199-af8bfe4c80e1" />


<img width="1654" height="909" alt="Screenshot 2026-01-03 171642" src="https://github.com/user-attachments/assets/5df9a08e-db25-471c-a1fa-437e9b03ba76" />


<img width="1708" height="912" alt="Screenshot 2026-01-03 171655" src="https://github.com/user-attachments/assets/7b9b2b83-33c4-491c-bd34-c4e58750c1c1" />


when the timer runs out

<img width="1750" height="905" alt="Screenshot 2026-01-03 171720" src="https://github.com/user-attachments/assets/0eece707-7f4b-40d5-aad2-283651851e3e" />


What happens in terminal
<img width="843" height="471" alt="Screenshot 2026-01-03 171827" src="https://github.com/user-attachments/assets/5742bb9d-04b9-4f82-bc92-f620d0a3970f" />








