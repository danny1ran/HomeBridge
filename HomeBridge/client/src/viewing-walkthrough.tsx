import { useState } from "react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";

/** Demonstrates the workflow without calling the booking API or storing data. */
export function ViewingWalkthrough({
  title,
  viewing,
  timezone,
}: {
  title: string;
  viewing: string;
  timezone: string;
}) {
  const [time, setTime] = useState("");
  const [step, setStep] = useState(0);
  return (
    <section className="viewing-demo" aria-labelledby="viewing-demo-title">
      <span className="tag">Interactive walkthrough · sample only</span>
      <h4 id="viewing-demo-title">Try the viewing journey</h4>
      <p>
        No real availability, reservation, or landlord notification. Your
        choices reset when you leave this property.
      </p>
      <ol className="viewing-demo-steps" aria-label="Walkthrough progress">
        {["Choose", "Review", "Landlord"].map((label, index) => (
          <li
            key={label}
            aria-current={step === index ? "step" : undefined}
            className={step >= index ? "reached" : ""}
          >
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <div className="viewing-demo-stage" aria-live="polite">
        {step === 0 ? (
          <>
            <h5>1. Choose an example time</h5>
            <p>Example day · displayed in {timezone}</p>
            <div className="slots">
              {["10:00 AM", "2:00 PM", "4:30 PM"].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={time === value}
                  className={time === value ? "selected" : ""}
                  onClick={() => setTime(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="button full"
              disabled={!time}
              onClick={() => setStep(1)}
            >
              Preview confirmation <ArrowRight size={15} />
            </button>
          </>
        ) : step === 1 ? (
          <>
            <h5>2. Review your example selection</h5>
            <dl>
              <div>
                <dt>Home</dt>
                <dd>{title}</dd>
              </div>
              <div>
                <dt>Viewing</dt>
                <dd>{viewing === "virtual" ? "Virtual" : "In person"}</dd>
              </div>
              <div>
                <dt>Example time</dt>
                <dd>
                  {time} · {timezone}
                </dd>
              </div>
            </dl>
            <p>
              In the connected app, confirming an available time creates the
              appointment for both participants.
            </p>
            <button
              type="button"
              className="button full"
              onClick={() => setStep(2)}
            >
              Preview landlord view <ArrowRight size={15} />
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => setStep(0)}
            >
              Change example time
            </button>
          </>
        ) : (
          <>
            <h5>3. What the landlord would see</h5>
            <div className="viewing-demo-receipt">
              <Check size={19} />
              <div>
                <strong>Example appointment card</strong>
                <span>{title}</span>
                <span>
                  {viewing === "virtual" ? "Virtual" : "In person"} · {time}
                </span>
                <small>Preview only — not saved or confirmed</small>
              </div>
            </div>
            <p>
              The connected landlord dashboard shows upcoming appointments.
              After a viewing ends, the landlord can mark it completed; students
              can cancel upcoming viewings.
            </p>
            <button
              type="button"
              className="button secondary full"
              onClick={() => {
                setTime("");
                setStep(0);
              }}
            >
              <RotateCcw size={15} />
              Restart walkthrough
            </button>
          </>
        )}
      </div>
    </section>
  );
}
