class Calendary {
    constructor(cfg) {
      this.today = new Date();
      this.lang = cfg.lang || "en";
      this.dayNames = {
        en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "So"],
        de: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
      };
      
      this.monthNames = {
        en: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December"
        ],
        de: [
          "Januar",
          "Februar",
          "März",
          "April",
          "Mai",
          "Juni",
          "Juli",
          "August",
          "September",
          "Oktober",
          "November",
          "Dezember"
        ]
      };
      
      this.containers = {
        month: this.cE(["flexcol", "monthName"], "monthDspl"),
        year: this.cE("flexcol", "yearDspl"),
        minute: this.cE("timeVal", null, "00"),
        hour: this.cE("timeVal", null, "00")
      };
      this.values = {
        day: cfg.day || this.today.getDate(),
        month: cfg.month || this.today.getMonth(),
        year: cfg.year || this.today.getFullYear(),
        minute: cfg.minute || this.today.getMinutes(),
        hour: cfg.hour || this.today.getHours()
      };
      this.timezoneOffset = -1 *(this.today.getTimezoneOffset()) / 60;
      this.buildWidget();
    }
  
    /**
    * Creates the main container and the panels inside
    */
    buildWidget() {
      this.container = this.cE(["cal-container", "flexrow"]);
  
      this.time = this.cE("panel", "time");
      this.buildTimeCtrls();
    
      
      this.date = this.cE("panel", "date");
      this.buildDateCtrls();
  
      
      for (let week = 0; week < 6; week++) {
        let row = this.cE("flexrow");
        for (let day = 0; day < 7; day++) {
          let col = this.cE(["flexcol", "day"], "d" + week + ":" + day, "");
          col.setAttribute("onclick", "cally.setDay(this.innerHTML)");
          row.appendChild(col);
        }
        this.date.appendChild(row);
      }
  
      this.container.appendChild(this.date);
  
      document.getElementsByClassName('cally-modal')[0].appendChild(this.container);
    }
    
    /**
    * Sets a new day when user clicks on the calendar
    */
    setDay(idx) {
      this.values.day = parseInt(idx);
      this.redraw();
    }
  
    /**
    * Change the hour value
    */
    toggleHours(sign) {
      switch(sign){
        case "+": {
          this.values.hour++;
          if (this.values.hour === 24) {
            this.values.hour = 0;
          }
          break;
        }
        case "-": {
          this.values.hour--;
          if (this.values.hour === -1) {
            this.values.hour = 23;
          }
          break;
        }
        default: break;
      }
      this.redraw();
    }
  
    /**
    * Change the minute value
    */
    toggleMinutes(sign) {
      switch(sign){
        case "+" :{
          this.values.minute++;
          if (this.values.minute === 60) {
            this.values.minute = 0;
          }
          break;
        }
        case "-" :{
          this.values.minute--;
          if (this.values.minute === -1) {
            this.values.minute = 59;
          }
          break;
        }
        default: break;
      }
      this.redraw();
    }
  
    /**
    * Change the active month
    */
    toggleMonths(sign) {
      switch (sign) {
        case "-" : {
          this.values.month--;
          if (this.values.month == -1) {
            this.values.month = 11;
            this.values.year--;
          }
          if(this.values.day > 28){
            this.values.day = 28;
          }
          break;
        }
        case "+" :{
          this.values.month++;
          if (this.values.month === 12) {
            this.values.month = 0;
           this.values.year++;
          }
          break;
        }
        default: break;
      }
      this.redraw();
    }
  
    redraw(){
      /**
      * Create a Dateobject with the active values
      */
      let dT = new Date(
        this.values.year,
        this.values.month,
        this.values.day,
        this.values.hour,
        this.values.minute,
        0
      );
      
      /** 
      * The string for the datetime-local input field
      * Could be splitted if two seperate inputs are used
      */
      this.iso = 
        this.values.year +
        '-' +
        ((this.values.month + 1 < 10) ? '0' + (this.values.month + 1) : (this.values.month + 1) ) +
        '-' +
        ((this.values.day < 10) ? '0' + (this.values.day) : this.values.day) +
        'T' +
        ((this.values.hour < 10) ? '0' + this.values.hour : this.values.hour) +
        ':' +
        ((this.values.minute < 10) ? '0' + this.values.minute : this.values.minute) +
        ':00'
      ;
      
      /**
      * Just for setting the datetime-local
      * Extend it with placeholders for target containers
      * to serve multiple inputs
      */
      this.setValue();
      
      /**
      * Refresh the display
      */
      this.setCally(dT);
    }
  
    /**
    * Method for the construction of the date panel and the
    * controls inside
    */
    buildDateCtrls() {
      /**
      * Container for the month controls
      */
      let row = this.cE("flexrow", "monthCtrl");
      
      /**
      * Button to decrease the active month
      */
      let arrLeft = this.cE("flexcol", "subMonth", "◀");
      arrLeft.addEventListener('click', function(){
        cally.toggleMonths("-");
      });
      
      /**
      * Button to increase the active month
      */
      let arrRight = this.cE("flexcol", "addMonth", "▶");
      arrRight.addEventListener('click', function(){
        cally.toggleMonths("+");
      });
  
      
      row.appendChild(arrLeft);
      row.appendChild(this.containers.month);
      row.appendChild(this.containers.year);
      row.appendChild(arrRight);
      this.date.appendChild(row);
      
      let weekdays = this.cE("flexrow", "weekdays");
      for (let i = 0; i < this.dayNames[this.lang].length; i++) {
        let day = this.cE(
          ["flexcol", "dayName"],
          "",
          this.dayNames[this.lang][i]
        );
        weekdays.appendChild(day);
      }
      this.date.appendChild(weekdays);
    }
    
    /**
    * Method for the construction of the time panel and the
    * controls inside
    */
    buildTimeCtrls() {
      /**
      * Time controls for adding hours and minutes
      */
      let upperCtrls = this.cE(["flexrow", "even"]);
      
      /**
      * Button to increase the hour value
      */
      let nextHour = this.cE("timeCtrlBtn", null, "+");
      nextHour.setAttribute("onclick", "cally.toggleHours('+');");
      upperCtrls.appendChild(nextHour);
      
      /*
      * Button to increase the minute value
      */
      let nextMinute = this.cE("timeCtrlBtn", null, "+");
      nextMinute.setAttribute("onclick", "cally.toggleMinutes('+');");
      upperCtrls.appendChild(nextMinute);
  
      /**
      * Display for the time values
      */
      let timeDspl = this.cE(["flexrow", "even"]);
      
      /**
      * The divs for the visible hour and minute values
      */
      timeDspl.appendChild(this.containers.hour);
      timeDspl.appendChild(this.containers.minute);
  
      /**
      * The lower time-controls
      */
      let lowerCtrls = this.cE(["flexrow", "even"]);
      
      /**
      * Button decrease lower the hour value 
      */
      let prevHour = this.cE("timeCtrlBtn", null, "-");
      prevHour.setAttribute("onclick", 'cally.toggleHours("-");');
      lowerCtrls.appendChild(prevHour);
      
      /**
      * Button to decrease the minute value
      */
      let prevMinute = this.cE("timeCtrlBtn", null, "-");
      prevMinute.setAttribute("onclick", 'cally.toggleMinutes("-");');
      lowerCtrls.appendChild(prevMinute);

      /**
      * Push it all to the time container 
      */
      this.time.appendChild(upperCtrls);
      this.time.appendChild(timeDspl);
      this.time.appendChild(lowerCtrls);
      
      /**
      * And the time panel to the container;
      */
      this.container.appendChild(this.time);
      
      return true;
    }
  
    /**
     * Creates a DIV Elements with given properties
     *
     * @param array|string clss a string or array with classnames
     * @param string id the id of the element
     * @param string txt - text
     *
     * @return HTMLDivElement
     */
    cE(clss = null, id = null, txt = null) {
      let el = document.createElement("div");
      if (clss !== null) {
        if (Array.isArray(clss)) {
          for (let i = 0; i < clss.length; i++) {
            el.classList.add(clss[i]);
          }
        } else {
          el.classList.add(clss);
        }
      }
      if (id !== null) {
        el.setAttribute("id", id);
      }
      if (txt !== null) {
        let txtNode = document.createTextNode(txt);
        el.appendChild(txtNode);
      }
      return el;
    }
  
    /**
     * Returns the amount of days for a given month and year
     *
     * @param int month (1 - Jan to 12 - Dec)
     * @param int year
     *
     * @return int
     */
    amountOfDays(month, year) {
      return new Date(year, month, 0).getDate();
    }
  
    /**
     * Returns the index of weekday for a given month and year
     *
     * @param int month (1 - Jan to 12 - Dec)
     * @param int year
     *
     * @return int (0 - Sun to 6 - Sat)
     */
    firstDayIdx(month, year) {
      return new Date(year, month, 1).getDay();
    }
    clearCally() {
      let days = document.getElementsByClassName("day");
      if (days[0] != undefined) {
        for (let i = 0; i < days.length; i++) {
          days[i].innerHTML = "";
           if (days[i].classList.contains("marked")) {
            days[i].classList.remove("marked");
          }
          if (days[i].classList.contains("hoverable")) {
            days[i].classList.remove("hoverable");
          }
        }
      }
    }
    setCally(date = null) {
      if (date === null) {
        date = this.today;
      } else {
        this.values.day = date.getDate();
        this.values.month = date.getMonth();
        this.values.year = date.getFullYear();
        this.values.minute = date.getMinutes();
        this.values.hour = date.getHours();
      }
      /** Stunden setzen */
      this.containers.hour.innerHTML =
        this.values.hour < 10 ? "0" + this.values.hour : this.values.hour + "";
  
      /** Minuten Setzen */
      this.containers.minute.innerHTML =
        this.values.minute < 10
          ? "0" + this.values.minute
          : this.values.minute + "";
      this.containers.year.innerHTML = this.values.year;
      this.containers.month.innerHTML = this.monthNames[this.lang][
        this.values.month
      ];
      this.clearCally();
      let numDays = this.amountOfDays(this.values.month + 1, this.values.year);
      let weekCnt = 0;
      /**
       * First day of a month is a ... 0 == Mo , 6 == Su 
       * (native is 0 == Su, 6 == Sa)
       */
      let dayCnt = this.firstDayIdx(this.values.month, this.values.year);
      dayCnt = dayCnt === 0 ? 6 : dayCnt - 1;
      for (let i = 0; i < numDays; i++) {
        let col = document.getElementById("d" + weekCnt + ":" + dayCnt);
        col.classList.add("hoverable");
        col.appendChild(document.createTextNode(i + 1));
        col.classList.remove("marked");
        if (i + 1 === this.values.day) {
          col.classList.add("marked");
        }
        dayCnt++;
        if (dayCnt == 7) {
          weekCnt++;
          dayCnt = 0;
        }
      }
    }
    setValue(tar = null){
        if(tar === null){
          document.getElementById("showCally").value=this.iso;
          return;
        }
        document.getElementById(tar).value = this.iso;
    }
  }