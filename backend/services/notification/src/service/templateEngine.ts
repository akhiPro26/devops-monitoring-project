import Handlebars from "handlebars"

export class TemplateEngine {
  constructor() {
    this.registerHelpers()
  }

  private registerHelpers() {
    Handlebars.registerHelper("formatDate", (date: Date) => {
      return date.toLocaleString()
    })

    Handlebars.registerHelper("uppercase", (str: string) => {
      return str.toUpperCase()
    })

    Handlebars.registerHelper("eq", (a: any, b: any) => {
      return a === b
    })
  }

  render(template: string, data: Record<string, any>): string {
    try {
      const compiledTemplate = Handlebars.compile(template)
      return compiledTemplate(data)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Template rendering error: ${error.message}`)
      } else {
        throw new Error(`Template rendering error: ${String(error)}`)
      }
    }
  }
}
