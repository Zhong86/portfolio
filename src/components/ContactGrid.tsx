const contacts = [
  { key: "email", value: "billy.zhong0725@gmail.com", link: "mailto:billy.zhong0725@gmail.com" },
  { key: "whatsapp", value: "081319990725", link: "https://wa.me/6281319990725" },
  { key: "github", value: "github.com/Zhong86", link: "https://github.com/Zhong86" },
  { key: "instagram", value: "verlin_dev", link: "https://www.instagram.com/verlin_dev/" },
  { key: "linkedin", value: "Billy Zhong", link: "https://www.linkedin.com/in/billy-zhong-495a6a337/" },
];

export default function ContactGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {contacts.map((c) => (
        <a href={c.link} key={c.key}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-hairline rounded-md p-5 bg-surface">
          <div className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide mb-2">
            {c.key}
          </div>
          <div className="font-mono text-[15px] text-accent">{c.value}</div>
        </a>
      ))}
    </div>
  );
}
