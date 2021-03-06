const joi = require('joi')
const { FormComponent } = require('.')
const helpers = require('./helpers')

class CheckboxesField extends FormComponent {
  constructor (def, model) {
    super(def, model)
    const { options } = this
    const list = model.lists.find(list => list.name === options.list)
    const items = list.items
    const values = items.map(item => item.value)
    const itemSchema = joi[list.type]().valid(values)
    const itemsSchema = joi.array().items(itemSchema)
    const alternatives = joi.alternatives([itemSchema, itemsSchema])

    this.list = list
    this.items = items
    this.formSchema = helpers.buildFormSchema(alternatives, this, options.required !== false)
    this.stateSchema = helpers.buildStateSchema(alternatives, this)
  }

  getFormSchemaKeys () {
    return { [this.name]: this.formSchema }
  }

  getStateSchemaKeys () {
    return { [this.name]: this.stateSchema }
  }

  getDisplayStringFromState (state) {
    const { name, items } = this

    if (name in state) {
      const value = state[name]

      if (value === null) {
        return ''
      }

      const checked = Array.isArray(value) ? value : [value]
      return checked.map(check => items.find(item => item.value === check).text).join(', ')
    }
  }

  getViewModel (formData, errors) {
    const { name, items } = this
    const viewModel = super.getViewModel(formData, errors)
    let formDataItems = []

    if (name in formData) {
      formDataItems = Array.isArray(formData[name])
        ? formData[name]
        : formData[name].split(',')
    }

    Object.assign(viewModel, {
      fieldset: {
        legend: viewModel.label
      },
      items: items.map(item => {
        const itemModel = {
          text: item.text,
          value: item.value,
          // Do a loose string based check as state may or
          // may not match the item value types.
          checked: !!formDataItems.find(i => '' + item.value === i)
        }

        if (this.options.bold) {
          itemModel.label = {
            classes: 'govuk-label--s'
          }
        }

        if (item.description) {
          itemModel.hint = {
            html: item.description
          }
        }

        return itemModel
      })
    })

    return viewModel
  }
}

module.exports = CheckboxesField
