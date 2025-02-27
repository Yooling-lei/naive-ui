import {
  computed,
  defineComponent,
  h,
  ref,
  PropType,
  CSSProperties,
  Fragment,
  toRef
} from 'vue'
import {
  format,
  getYear,
  addMonths,
  startOfDay,
  startOfMonth,
  getMonth
} from 'date-fns'
import { useMergedState } from 'vooks'
import { dateArray } from '../../date-picker/src/utils'
import { ChevronLeftIcon, ChevronRightIcon } from '../../_internal/icons'
import { NBaseIcon } from '../../_internal'
import { call } from '../../_utils'
import type { ExtractPublicPropTypes, MaybeArray } from '../../_utils'
import { NButton, NButtonGroup } from '../../button'
import { useConfig, useLocale, useTheme, useThemeClass } from '../../_mixins'
import type { ThemeProps } from '../../_mixins'
import { calendarLight } from '../styles'
import type { CalendarTheme } from '../styles'
import type { OnUpdateValue, DateItem, OnPanelChange } from './interface'
import style from './styles/index.cssr'

const calendarProps = {
  ...(useTheme.props as ThemeProps<CalendarTheme>),
  isDateDisabled: Function as PropType<(date: number) => boolean | undefined>,
  value: Number,
  defaultValue: {
    type: Number as PropType<number | null>,
    default: null
  },
  onPanelChange: Function as PropType<OnPanelChange>,
  'onUpdate:value': [Function, Array] as PropType<MaybeArray<OnUpdateValue>>,
  onUpdateValue: [Function, Array] as PropType<MaybeArray<OnUpdateValue>>
} as const

export type CalendarProps = ExtractPublicPropTypes<typeof calendarProps>

export default defineComponent({
  name: 'Calendar',
  props: calendarProps,
  setup (props) {
    const { mergedClsPrefixRef, inlineThemeDisabled } = useConfig(props)
    const themeRef = useTheme(
      'Calendar',
      '-calendar',
      style,
      calendarLight,
      props,
      mergedClsPrefixRef
    )
    const { localeRef, dateLocaleRef } = useLocale('DatePicker')
    const now = Date.now()
    // ts => timestamp
    const monthTsRef = ref(startOfMonth(now).valueOf())
    const uncontrolledValueRef = ref<number | null>(props.defaultValue || null)
    const mergedValueRef = useMergedState(
      toRef(props, 'value'),
      uncontrolledValueRef
    )

    function doUpdateValue (value: number, time: DateItem): void {
      const { onUpdateValue, 'onUpdate:value': _onUpdateValue } = props
      if (onUpdateValue) {
        call(onUpdateValue, value, time)
      }
      if (_onUpdateValue) {
        call(_onUpdateValue, value, time)
      }
      uncontrolledValueRef.value = value
    }

    function handlePrevClick (): void {
      const monthTs = addMonths(monthTsRef.value, -1).valueOf()
      monthTsRef.value = monthTs
      props.onPanelChange?.({
        year: getYear(monthTs),
        month: getMonth(monthTs) + 1
      })
    }
    function handleNextClick (): void {
      const monthTs = addMonths(monthTsRef.value, 1).valueOf()
      monthTsRef.value = monthTs
      props.onPanelChange?.({
        year: getYear(monthTs),
        month: getMonth(monthTs) + 1
      })
    }
    function handleTodayClick (): void {
      const { value: monthTs } = monthTsRef
      const oldYear = getYear(monthTs)
      const oldMonth = getMonth(monthTs)
      const newMonthTs = startOfMonth(now).valueOf()
      const newYear = getYear(newMonthTs)
      const newMonth = getMonth(newMonthTs)
      if (oldYear !== newYear || oldMonth !== newMonth) {
        props.onPanelChange?.({
          year: newYear,
          month: newMonthTs
        })
      }
      monthTsRef.value = newMonthTs
    }
    const cssVarsRef = computed(() => {
      const {
        common: { cubicBezierEaseInOut },
        self: {
          borderColor,
          borderColorModal,
          borderColorPopover,
          borderRadius,
          titleFontSize,
          textColor,
          titleFontWeight,
          titleTextColor,
          dayTextColor,
          fontSize,
          lineHeight,
          dateColorCurrent,
          dateTextColorCurrent,
          cellColorHover,
          cellColor,
          cellColorModal,
          barColor,
          cellColorPopover,
          cellColorHoverModal,
          cellColorHoverPopover
        }
      } = themeRef.value
      return {
        '--n-bezier': cubicBezierEaseInOut,
        '--n-border-color': borderColor,
        '--n-border-color-modal': borderColorModal,
        '--n-border-color-popover': borderColorPopover,
        '--n-border-radius': borderRadius,
        '--n-text-color': textColor,
        '--n-title-font-weight': titleFontWeight,
        '--n-title-font-size': titleFontSize,
        '--n-title-text-color': titleTextColor,
        '--n-day-text-color': dayTextColor,
        '--n-font-size': fontSize,
        '--n-line-height': lineHeight,
        '--n-date-color-current': dateColorCurrent,
        '--n-date-text-color-current': dateTextColorCurrent,
        '--n-cell-color': cellColor,
        '--n-cell-color-modal': cellColorModal,
        '--n-cell-color-popover': cellColorPopover,
        '--n-cell-color-hover': cellColorHover,
        '--n-cell-color-hover-modal': cellColorHoverModal,
        '--n-cell-color-hover-popover': cellColorHoverPopover,
        '--n-bar-color': barColor
      }
    })
    const themeClassHandle = inlineThemeDisabled
      ? useThemeClass('calendar', undefined, cssVarsRef, props)
      : undefined
    return {
      mergedClsPrefix: mergedClsPrefixRef,
      locale: localeRef,
      dateLocale: dateLocaleRef,
      now,
      mergedValue: mergedValueRef,
      monthTs: monthTsRef,
      dateItems: computed(() => {
        return dateArray(
          monthTsRef.value,
          mergedValueRef.value,
          now,
          localeRef.value.firstDayOfWeek,
          true
        )
      }),
      doUpdateValue,
      handleTodayClick,
      handlePrevClick,
      handleNextClick,
      mergedTheme: themeRef,
      cssVars: inlineThemeDisabled ? undefined : cssVarsRef,
      themeClass: themeClassHandle?.themeClass,
      onRender: themeClassHandle?.onRender
    }
  },
  render () {
    const {
      isDateDisabled,
      mergedClsPrefix,
      monthTs,
      cssVars,
      mergedValue,
      mergedTheme,
      $slots,
      locale: { monthBeforeYear, today },
      dateLocale: { locale },
      handleTodayClick,
      handlePrevClick,
      handleNextClick,
      onRender
    } = this
    onRender?.()
    const normalizedValue = mergedValue && startOfDay(mergedValue).valueOf()
    const localeMonth = format(monthTs, 'MMMM', { locale })
    const year = getYear(monthTs)
    const title = monthBeforeYear
      ? `${localeMonth} ${year}`
      : `${year} ${localeMonth}`
    return (
      <div
        class={[`${mergedClsPrefix}-calendar`, this.themeClass]}
        style={cssVars as CSSProperties}
      >
        <div class={`${mergedClsPrefix}-calendar-header`}>
          <div class={`${mergedClsPrefix}-calendar-header__title`}>{title}</div>
          <div class={`${mergedClsPrefix}-calendar-header__extra`}>
            <NButtonGroup>
              {{
                default: () => (
                  <>
                    <NButton
                      size="small"
                      onClick={handlePrevClick}
                      theme={mergedTheme.peers.Button}
                      themeOverrides={mergedTheme.peerOverrides.Button}
                    >
                      {{
                        icon: () => (
                          <NBaseIcon
                            clsPrefix={mergedClsPrefix}
                            class={`${mergedClsPrefix}-calendar-prev-btn`}
                          >
                            {{ default: () => <ChevronLeftIcon /> }}
                          </NBaseIcon>
                        )
                      }}
                    </NButton>
                    <NButton
                      size="small"
                      onClick={handleTodayClick}
                      theme={mergedTheme.peers.Button}
                      themeOverrides={mergedTheme.peerOverrides.Button}
                    >
                      {{ default: () => today }}
                    </NButton>
                    <NButton
                      size="small"
                      onClick={handleNextClick}
                      theme={mergedTheme.peers.Button}
                      themeOverrides={mergedTheme.peerOverrides.Button}
                    >
                      {{
                        icon: () => (
                          <NBaseIcon
                            clsPrefix={mergedClsPrefix}
                            class={`${mergedClsPrefix}-calendar-next-btn`}
                          >
                            {{ default: () => <ChevronRightIcon /> }}
                          </NBaseIcon>
                        )
                      }}
                    </NButton>
                  </>
                )
              }}
            </NButtonGroup>
          </div>
        </div>
        <div class={`${mergedClsPrefix}-calendar-dates`}>
          {this.dateItems.map(
            ({ dateObject, ts, inCurrentMonth, isCurrentDate }, index) => {
              const { year, month, date } = dateObject
              const fullDate = format(ts, 'yyyy-MM-dd')
              const disabled = !inCurrentMonth || isDateDisabled?.(ts) === true
              const selected = normalizedValue === startOfDay(ts).valueOf()
              return (
                <div
                  key={isCurrentDate ? 'current' : index}
                  class={[
                    `${mergedClsPrefix}-calendar-cell`,
                    disabled && `${mergedClsPrefix}-calendar-cell--disabled`,
                    isCurrentDate &&
                      `${mergedClsPrefix}-calendar-cell--current`,
                    selected && `${mergedClsPrefix}-calendar-cell--selected`
                  ]}
                  onClick={() => {
                    this.doUpdateValue(ts, {
                      year,
                      month: month + 1,
                      date
                    })
                    this.monthTs = startOfMonth(ts).valueOf()
                  }}
                >
                  <div class={`${mergedClsPrefix}-calendar-date`}>
                    {disabled ? (
                      <div
                        class={`${mergedClsPrefix}-calendar-date__date`}
                        title={fullDate}
                        key="disabled"
                      >
                        {date}
                      </div>
                    ) : (
                      <div
                        class={`${mergedClsPrefix}-calendar-date__date`}
                        title={fullDate}
                        key="available"
                      >
                        {date}
                      </div>
                    )}
                    {index < 7 && (
                      <div
                        class={`${mergedClsPrefix}-calendar-date__day`}
                        title={fullDate}
                      >
                        {format(ts, 'EEE', {
                          locale
                        })}
                      </div>
                    )}
                  </div>
                  {$slots.default?.({
                    year,
                    month: month + 1,
                    date
                  })}
                  <div
                    class={`${mergedClsPrefix}-calendar-cell__bar`}
                    key={month}
                  />
                </div>
              )
            }
          )}
        </div>
      </div>
    )
  }
})
