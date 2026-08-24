export const setPasswordEmailTemplate = ({
  userName,
  userExist,
  resetLink,
  redirectLink,
  logoURL,
}: {
  userName: string;
  userExist: boolean;
  resetLink: string;
  redirectLink: string;
  logoURL: string;
}): string => `
        <div><br /></div>
          <table
            cellspacing="0"
            cellpadding="0"
            style="
              background-color: #fff;
              width: 100%;
              min-width: 100%;
              padding: 40px 0;
            "
          >
            <tbody>
              <tr>
                <td align="center">
                  <div
                    style="
                      border: 1px solid rgb(238, 238, 238);
                      box-sizing: border-box;
                      margin: 0px auto;
                      max-width: 600px;
                      width: 100%;
                    "
                  >
                    <div style="padding: 40px 50px; line-height: 1.6">
                      <div style="
                        width: 150px;
                        height: 100px;
                        background-image: url(${logoURL});
                        background-size: contain;
                        background-repeat: no-repeat;
                        background-position: center;
                      ">
                      </div>
                      <h1 style="font-family: Lato, Helvetica" class="align-left">
                        Welcome to Universal Portal Wealth Demo<br />
                      </h1>
                      <p
                        style="margin: 0px 0px 20px; text-align: left"
                        class="align-left"
                      >
                        <span class="colour" style="color: rgb(51, 51, 51)"
                          ><span
                            class="size"
                            style="font-size: 16px; margin: 0px 0px 20px"
                            ><b>Hi ${userName.split(" ")[0]}</b>,</span
                          ></span
                        ><br />
                      </p>
                      <p
                        style="margin: 0px 0px 20px; text-align: left"
                        class="align-left"
                      >
                        <span class="colour" style="color: rgb(51, 51, 51)"
                          ><span
                            class="size"
                            style="font-size: 16px; margin: 0px 0px 20px"
                            >Thanks for registering for the Universal Portal Wealth demo from M Strategy. Please click the link below to create a password. Once completed you will be directed to the Universal Portal Wealth Log In page. </span
                          ></span
                        ><br />
                      </p>
                      <div
                        style="
                          background-color: rgb(243, 243, 252);
                          border-radius: 8px;
                          padding: 25px;
                          margin: 30px 0;
                        "
                      >
                        <div style="margin-bottom: 20px">
                          <p
                            style="margin: 0px 0px 10px; text-align: left"
                            class="align-left"
                          >
                            <font color="#333333">
                              <span style="font-size: 15px"
                                >  ${userExist
            ? "You can get started using this link"
            : "Create password using this link"
          } :<br /><a
                                  href="${userExist ? redirectLink : resetLink}"
                                  target="_blank"
                                  style="word-wrap: break-word; word-break: break-all; overflow-wrap: break-word; max-width: 100%; display: inline-block;"
                                  >${userExist ? redirectLink : resetLink}</a
                                  ><br
                                /></span>
                            </font> 
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      style="
                        font-family: Lato, Helvetica, 'Helvetica Neue', Arial, sans-serif;
                        background-color: rgb(248, 249, 250);
                        text-align: center;
                        padding: 20px 50px;
                        border-top: 1px solid rgb(238, 238, 238);
                      "
                    >
                      <p
                        style="margin: 0px 0px 10px; text-align: center"
                        class="align-center"
                      >
                        <span class="colour" style=""
                          ><span
                            class="size"
                            style="
                              color: rgb(102, 102, 102);
                              font-size: 14px;
                              margin: 0px 0px 10px;
                            "
                            >M Strategy Group 2026.</span
                          ><span
                            class="size"
                            style="
                              color: rgb(102, 102, 102);
                              font-size: 14px;
                              margin: 0px 0px 10px;
                            "
                          >
                            All rights reserved.</span
                          ></span
                        ><br />
                      </p>
                      <p style="margin: 0px; text-align: center" class="align-center">
                        <span class="colour" style="color: rgb(102, 102, 102)"
                          ><span class="size" style="font-size: 14px; margin: 0px"
                            >This is an automated message, please do not reply directly to
                            this email.</span
                          ></span
                        ><br />
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <br />
          <style>
            @media screen and (max-width: 600px) {
              div[style*="max-width: 600px"] {
                width: 100% !important;
                padding: 0 !important;
              }
              div[style*="padding: 40px 50px"],
              div[style*="padding: 20px 50px"] {
                padding: 20px !important;
              }
              h1[style*="font-size: 24px"] {
                font-size: 20px !important;
              }
              .action-buttons a {
                display: block !important;
                margin: 10px 0 !important;
              }
            }
            @media screen and (min-width: 601px) {
              table[style*="width: 100%"] {
                padding: 40px !important;
              }
            }
          </style>
        <div><br /></div>
      `;
