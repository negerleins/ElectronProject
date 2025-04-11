import { Terminal } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

function AlertComponent({
  title = "Heads up!",
  description = "You can add components to your app using the cli.",
}) {
  return (
    <Alert className="inline-flex">
      <Terminal className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}

export { AlertComponent }
