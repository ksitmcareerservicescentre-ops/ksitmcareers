import { site } from "@/config/site";
import { Icon } from "@/components/ui/icon";
export function Contact() {
  return (
    <section
      id="contacts"
      className="section contact-section"
      aria-labelledby="contact-title"
    >
      <div className="container contact-grid">
        <div>
          <p className="eyebrow">Let&apos;s talk about your future</p>
          <h2 id="contact-title">
            Every journey starts
            <br />
            with a conversation.
          </h2>
          <p>
            Reach out to the {site.centre}.<br />
            We&apos;re here to help you find your direction.
          </p>
          <a href={`mailto:${site.email}`} className="button">
            Contact the team <Icon name="arrow" />
          </a>
        </div>
        <address className="contact-details">
          <div>
            <Icon name="mail" />
            <div>
              <span>Email us</span>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </div>
          </div>
          <div>
            <Icon name="pin" />
            <div>
              <span>Find us</span>
              <p>{site.address}</p>
            </div>
          </div>
          <div>
            <Icon name="globe" />
            <div>
              <span>Our website</span>
              <a href={site.url}>www.ksitmcareers.edu.ng</a>
            </div>
          </div>
          <div>
            <Icon name="phone" />
            <div>
              <span>Call Nura Sadiq</span>
              <a href={`tel:${site.phone.replaceAll(" ", "")}`}>{site.phone}</a>
            </div>
          </div>
        </address>
      </div>
    </section>
  );
}
